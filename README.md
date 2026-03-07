# The Sorcerer's Hand - Roguelike Poker

A magical spin on poker roguelikes where you cast spells based on your hands.

## Local Development

To run the game locally, you can use the `serve` utility:

```bash
npm install
npm dev
```

## Deployment on Vercel

The project is ready to be deployed as a static site. 
If you have the Vercel CLI installed, you can simply run:

```bash
vercel
```

Alternatively, push this project to a GitHub repository and connect it to Vercel for automatic deployments.
Vercel will automatically detect this as a static project.

### Project Structure
- `index.html`: Main entry point
- `style.css`: Premium visuals and animations
- `engine.js`: Card logic and hand evaluation
- `main.js`: Main game loop, state management, and combat animations
- `translations.js`: Multi-language support
- `assets/`: Image assets for cards, icons, and enemies
