# Torn Faction Respect Tracker 📊

A modern web application for analyzing faction member performance and respect contributions in [Torn City](https://www.torn.com). Track, compare, and export detailed statistics about your faction's attack data with an intuitive interface and powerful filtering options.

![Torn Faction Respect Tracker](https://img.shields.io/badge/Torn-Faction%20Tracker-blue?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3-38B2AC?style=for-the-badge&logo=tailwind-css)

## ✨ Features

### 📈 Performance Analytics
- **Member Performance Tracking**: Detailed statistics for each faction member including total respect, attack counts, success rates, and specialized metrics
- **Interactive Charts**: Visual representations of faction performance with dark mode support
- **Respect Timeline**: Track cumulative respect gains over time
- **Top Performers**: Identify your faction's most valuable contributors

### 🔍 Advanced Filtering
- **Time Range Filters**: Analyze data from specific time periods (1 hour to all-time)
- **Member Comparison**: Multi-select member comparison with search functionality
- **Attack Type Filtering**: Filter by war, chain, bonus, regular, retaliation, and overseas attacks
- **Result Filtering**: Focus on specific attack outcomes (attacked, mugged, hospitalized, etc.)
- **Bonus Hit Detection**: Identify and analyze chain bonus hits at 10, 20, 40, 80+ respect

### 💾 Data Management
- **Session Caching**: Intelligent caching system for improved performance
- **Multiple Export Formats**: Export data as CSV or JSON
- **Real-time Sync**: Fetch the latest faction data with progress tracking
- **Pagination Support**: Efficient handling of large datasets

### 🎨 Modern Interface
- **Dark Mode**: Full dark theme with system preference detection
- **Responsive Design**: Optimized for desktop and mobile devices
- **Accessibility**: Screen reader support and keyboard navigation
- **Loading States**: Smooth loading indicators and progress bars

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and pnpm
- A valid [Torn API key](https://www.torn.com/preferences.php#tab=api)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Edgeworthless/tornrespect.git
   cd tornrespect
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Start the development server**
   ```bash
   pnpm dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

### Configuration

1. **Get your Torn API Key**
   - Go to [Torn Preferences > API](https://www.torn.com/preferences.php#tab=api)
   - Generate a new API key with appropriate permissions

2. **Configure the application**
   - Click the settings icon (⚙️) in the header
   - Enter your API key
   - Click "Save"

3. **Sync faction data**
   - Click the "Sync" button to fetch your faction's attack data
   - The app will automatically cache data for improved performance

## 📊 Understanding the Data

### Attack Categories
- **War Attacks**: Attacks made during faction wars
- **Chain Attacks**: Attacks made during faction chains (chain > 9)
- **Bonus Hits**: Special chain attacks at respect milestones (10, 20, 40, 80, 160, 320...)
- **Regular Attacks**: Standard faction attacks
- **Retaliation**: Revenge attacks
- **Overseas**: Attacks made while traveling

### Key Metrics
- **Total Respect**: Sum of all respect gained from successful attacks
- **Success Rate**: Percentage of successful attacks vs total attempts
- **Fair Fight Efficiency**: Average fair fight bonus multiplier
- **Best Single Hit**: Highest respect gained from a single attack
- **Days in Faction**: Member tenure tracking

## 🔧 Technical Details

### Built With
- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS with dark mode support
- **Charts**: Recharts for data visualization
- **Icons**: Heroicons
- **API**: Torn API v2 with cursor-based pagination
- **Build Tool**: Vite

### Architecture
- **Client-side only**: No backend required - runs entirely in the browser
- **Context API**: Centralized state management
- **Session Storage**: Persistent caching between sessions
- **Rate Limiting**: Respects Torn API rate limits (600ms delays)
- **Error Handling**: Comprehensive error states and user feedback

### Performance Optimizations
- **Batch Processing**: Processes attacks in batches of 500
- **Smart Caching**: Avoids redundant API calls
- **Lazy Loading**: Efficient data loading strategies
- **Debounced Filtering**: Smooth filter interactions

## 🔒 Privacy & Security

- **Local Storage Only**: All data is stored locally in your browser
- **No External Servers**: Your API key never leaves your device
- **Secure API Calls**: Direct communication with Torn's official API
- **No Data Collection**: We don't track or store any personal information

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- TypeScript with strict mode
- ESLint and Prettier configuration
- Tailwind CSS for styling
- Conventional commit messages

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Torn City**: For providing the comprehensive API that makes this project possible
- **The Torn Community**: For feedback and feature suggestions
- **Open Source Libraries**: All the amazing tools that power this application

## 📞 Support

If you encounter any issues or have questions:

1. **Check the Issues**: Look through existing [GitHub Issues](https://github.com/Edgeworthless/tornrespect/issues)
2. **Create a New Issue**: If your problem isn't covered, create a new issue with details
3. **Torn Profile**: Contact [Manuel [3747263]](https://www.torn.com/profiles.php?XID=3747263) in-game

---

<div align="center">

**Made with ❤️ by [Manuel [3747263]](https://www.torn.com/profiles.php?XID=3747263)**

</div>