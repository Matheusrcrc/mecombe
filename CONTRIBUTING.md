# Contributing to Dashboard MECOBE Premium

Thank you for your interest in contributing to the MECOBE Dashboard project! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- Git
- Modern web browser
- Text editor (VS Code recommended)

### Development Setup
1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/dashboard-mecobe-premium.git
   cd dashboard-mecobe-premium
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start development server:
   ```bash
   npm start
   ```

## 🎯 Code Standards

### HTML
- Use semantic HTML5 elements
- Include proper ARIA labels and descriptions
- Maintain heading hierarchy (h1, h2, h3...)
- Add alt text for all images
- Ensure keyboard accessibility

### CSS
- Use CSS Custom Properties for theming
- Follow mobile-first responsive design
- Use BEM-like naming conventions
- Maintain consistent spacing and typography
- Support high contrast mode
- Include print styles

### JavaScript
- Use ES6+ features
- Follow modular architecture
- Include comprehensive error handling
- Add JSDoc comments for functions
- Use semantic variable and function names
- Implement debouncing for event handlers

### Accessibility Requirements
- WCAG 2.1 AA compliance mandatory
- Test with screen readers
- Ensure keyboard navigation works
- Maintain proper focus management
- Include skip links
- Use semantic markup

## 🧪 Testing

### Before Submitting
1. **Accessibility Test:**
   ```bash
   npm run test:accessibility
   ```

2. **HTML Validation:**
   ```bash
   npm run test:html
   ```

3. **Lighthouse Audit:**
   ```bash
   npm run lighthouse
   ```

4. **Cross-browser Testing:**
   - Chrome (latest)
   - Firefox (latest)
   - Safari (latest)
   - Edge (latest)

### Manual Testing Checklist
- [ ] Keyboard navigation works completely
- [ ] Screen reader announces content properly
- [ ] Print functionality works correctly
- [ ] Responsive design on different screen sizes
- [ ] High contrast mode compatibility
- [ ] Performance metrics meet targets

## 📝 Commit Guidelines

### Commit Message Format
```
type(scope): description

[optional body]

[optional footer]
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples
```bash
feat(accessibility): add skip links for keyboard navigation

fix(print): resolve data collection error in Safari

docs(readme): update installation instructions

style(css): improve mobile responsive breakpoints
```

## 🔄 Pull Request Process

1. **Create Feature Branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Your Changes:**
   - Follow code standards
   - Add tests if applicable
   - Update documentation

3. **Test Thoroughly:**
   ```bash
   npm test
   npm run lint
   ```

4. **Submit Pull Request:**
   - Use clear, descriptive title
   - Include detailed description
   - Reference related issues
   - Add screenshots for UI changes

### PR Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Accessibility tested
- [ ] Cross-browser tested
- [ ] Mobile responsive tested
- [ ] Print functionality tested

## Screenshots
[If applicable]

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added/updated
```

## 🐛 Reporting Issues

### Bug Reports
Include:
- Browser and version
- Operating system
- Steps to reproduce
- Expected vs actual behavior
- Screenshots or videos
- Console errors

### Feature Requests
Include:
- Use case description
- Proposed solution
- Alternative solutions considered
- Additional context

## 📋 Code Review Process

### What We Look For
- Code quality and maintainability
- Accessibility compliance
- Performance impact
- Security considerations
- Documentation completeness
- Test coverage

### Review Timeline
- Small changes: 1-2 days
- Medium changes: 3-5 days
- Large changes: 1+ weeks

## 🏆 Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Given appropriate Git attribution

## 📞 Getting Help

- Create an issue for questions
- Join discussions in existing issues
- Check documentation first

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to making healthcare dashboards more accessible and user-friendly! 🎉