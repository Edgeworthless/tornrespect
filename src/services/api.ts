import {
  AttackData,
  FactionMember,
  AttacksResponse,
  MembersResponse
} from '../types/api'

export class TornAPIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message)
    this.name = 'TornAPIError'
  }
}

export class TornAPIClient {
  private readonly baseURL = 'https://api.torn.com/v2'
  private readonly rateLimitDelayMs = 600
  private lastRequestTime = 0
  private requestQueue: Array<() => Promise<void>> = []
  private isProcessingQueue = false

  constructor(private apiKey: string) {
    if (!apiKey) {
      throw new TornAPIError('API key is required')
    }
  }

  private async waitForRateLimit(): Promise<void> {
    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequestTime

    if (timeSinceLastRequest < this.rateLimitDelayMs) {
      const delay = this.rateLimitDelayMs - timeSinceLastRequest
      await new Promise((resolve) => setTimeout(resolve, delay))
    }

    this.lastRequestTime = Date.now()
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue) return

    this.isProcessingQueue = true

    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift()
      if (request) {
        await this.waitForRateLimit()
        await request()
      }
    }

    this.isProcessingQueue = false
  }

  private async queueRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await requestFn()
          resolve(result)
        } catch (error) {
          reject(error)
        }
      })

      this.processQueue()
    })
  }

  private async makeRequest<T>(
    endpoint: string,
    params?: URLSearchParams
  ): Promise<T> {
    // Remove leading slash to properly append to base URL
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint
    const url = new URL(cleanEndpoint, this.baseURL + '/')
    
    // Add API key to query parameters
    const searchParams = new URLSearchParams(params)
    searchParams.append('key', this.apiKey)
    url.search = searchParams.toString()

    const response = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json'
      }
    })

    if (!response.ok) {
      let errorMessage = `API Error: ${response.status} ${response.statusText}`

      try {
        const errorData = await response.json()
        if (errorData.error) {
          errorMessage = errorData.error.error || errorMessage
        }
      } catch {
        // Ignore JSON parsing errors for error responses
      }

      throw new TornAPIError(errorMessage, response.status)
    }

    const data = await response.json()

    if (data.error) {
      throw new TornAPIError(
        data.error.error || 'Unknown API error',
        undefined,
        data.error.code
      )
    }

    return data
  }

  async fetchFactionMembers(): Promise<FactionMember[]> {
    return this.queueRequest(async () => {
      const response =
        await this.makeRequest<MembersResponse>('/faction/members')
      
      // Handle both array and object response formats
      if (Array.isArray(response.members)) {
        return response.members
      } else {
        // Convert object to array
        return Object.values(response.members)
      }
    })
  }

  private async fetchAttacksBatch(
    limit: number = 500,
    from?: number,
    to?: number,
    nextCursor?: string
  ): Promise<AttacksResponse> {
    // If we have a cursor, use it directly instead of building our own parameters
    if (nextCursor) {
      try {
        const url = new URL(nextCursor)
        console.log('Using cursor URL directly:', nextCursor)
        // Extract all parameters from the cursor URL
        const cursorParams = new URLSearchParams(url.search)
        return this.makeRequest<AttacksResponse>('/faction/attacks', cursorParams)
      } catch (error) {
        console.warn('Failed to parse cursor URL:', nextCursor, error)
      }
    }

    // For the first request, build parameters normally
    const params = new URLSearchParams({
      limit: limit.toString(),
      sort: 'ASC',
      filters: 'outgoing'
    })

    if (from) {
      params.append('from', from.toString())
    }
    
    if (to) {
      params.append('to', to.toString())
    }

    return this.makeRequest<AttacksResponse>('/faction/attacks', params)
  }

  async fetchAllAttacks(
    fromTimestamp?: number,
    toTimestamp?: number,
    onProgress?: (current: number, total?: number) => void
  ): Promise<{ attacks: AttackData[]; currentMembers: FactionMember[] }> {
    const [currentMembers] = await Promise.all([this.fetchFactionMembers()])

    const allAttacks: AttackData[] = []
    let totalFetched = 0
    let hasMoreData = true
    let batchCount = 0
    let nextCursor: string | undefined
    let previousCursor: string | undefined
    let consecutiveSmallBatches = 0

    // For "All Time", we don't set any timestamp limits
    const isAllTime = !fromTimestamp && !toTimestamp

    // Fetch attacks in batches using cursor pagination
    while (hasMoreData && batchCount < 1000) { // Safety limit for all-time fetches
      const batch = await this.queueRequest(() =>
        this.fetchAttacksBatch(500, fromTimestamp, toTimestamp, nextCursor)
      )

      if (!batch.attacks || batch.attacks.length === 0) {
        break
      }

      // For time-bound queries, filter attacks that are outside our range
      const filteredAttacks = batch.attacks.filter((attack) => {
        if (fromTimestamp && attack.started < fromTimestamp) return false
        if (toTimestamp && attack.started > toTimestamp) return false
        return true
      })

      allAttacks.push(...filteredAttacks)
      totalFetched += batch.attacks.length

      if (onProgress) {
        onProgress(allAttacks.length, batch._metadata?.total)
      }

      // Check if we should continue based on API pagination
      // Using ASC sort (oldest first), we follow 'next' links to go forward in time
      nextCursor = batch._metadata?.links?.next || undefined
      
      console.log(`Batch ${batchCount + 1}: Got ${batch.attacks.length} attacks`)
      console.log('Metadata links:', batch._metadata?.links)
      console.log('Next cursor to use:', nextCursor)
      
      // Detect infinite loops: same cursor or very small batches repeating
      if (nextCursor === previousCursor) {
        console.log('Detected same cursor as previous batch, stopping to prevent infinite loop')
        hasMoreData = false
        break
      }
      
      if (batch.attacks.length <= 5) {
        consecutiveSmallBatches++
        if (consecutiveSmallBatches >= 3) {
          console.log('Detected 3+ consecutive small batches, likely at end of data')
          hasMoreData = false
          break
        }
      } else {
        consecutiveSmallBatches = 0
      }
      
      if (!nextCursor) {
        // No more pages available
        hasMoreData = false
      } else {
        // For time-bound queries, check if we've gone past our desired range
        // With ASC sort, we check if we've gone beyond the 'to' timestamp
        if (toTimestamp && batch.attacks.length > 0) {
          const newestInBatch = Math.max(...batch.attacks.map((a) => a.started))
          if (newestInBatch >= toTimestamp) {
            // We've reached data newer than our time range
            break
          }
        }
      }

      batchCount++
      previousCursor = nextCursor

      // Safety check: if we're fetching all time and have a lot of data, give user a chance to see progress
      if (isAllTime && batchCount % 10 === 0) {
        // Brief pause every 10 batches to keep UI responsive
        await new Promise(resolve => setTimeout(resolve, 10))
      }
    }

    console.log(`Fetched ${allAttacks.length} valid attacks from ${totalFetched} total in ${batchCount} batch(es)`)
    return { attacks: allAttacks, currentMembers }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.fetchFactionMembers()
      return true
    } catch (error) {
      console.error('API connection test failed:', error)
      return false
    }
  }

  getApiKey(): string {
    return this.apiKey
  }

  setApiKey(newKey: string): void {
    if (!newKey) {
      throw new TornAPIError('API key cannot be empty')
    }
    this.apiKey = newKey
  }

}
