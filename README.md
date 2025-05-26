# CGM Test-Rig Showcase

An Electron-based application showcasing the Continuous Glucose Monitor Test-Rig platform. This application provides a modern, responsive interface for exploring the features and capabilities of our CGM testing solution.

## Project Structure

```
cgm-web/
├── src/
│   ├── config/        # Configuration files
│   ├── styles/        # CSS styles
│   ├── scripts/       # JavaScript files
│   ├── components/    # Reusable components
│   └── main.js        # Main Electron process
├── public/
│   ├── assets/        # Static assets
│   └── index.html     # Main HTML file
└── package.json       # Project dependencies
```

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Setup

1. Clone the repository:
   ```bash
   git clone [repository-url]
   cd cgm-web
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the application:
   ```bash
   npm start
   ```

For development with DevTools:
```bash
npm run dev
```

## Configuration

The application uses JSON configuration files located in `src/config/` to manage content and settings. You can modify these files to update the application content without changing the code.

### Content Configuration

Edit `src/config/content.json` to update:
- Navigation items
- Hero section content
- Feature descriptions
- Team member information

## Building for Production

To create a production build:
```bash
npm run build
```

This will create platform-specific distributables in the `dist` directory.

## Development

The application is built with:
- Electron for cross-platform desktop support
- Modern JavaScript (ES6+)
- CSS Grid and Flexbox for responsive layouts
- JSON-based content management

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License. 