# Kanban Task Management App

A modern, responsive Kanban board built with pure HTML, CSS, and Vanilla JavaScript.

## Features

- **Three Columns**: Todo, In Progress, Done
- **Full CRUD**: Create, Read, Update, Delete tasks
- **Drag & Drop**: Easily move tasks between columns using the native HTML5 Drag and Drop API
- **Persistence**: Tasks are saved to `localStorage` and persist across page reloads
- **Search/Filter**: Quickly find tasks by title
- **Dark Mode**: Built-in toggle for light and dark themes
- **Responsive Design**: Works locally on both desktop and mobile screens
- **Zero Dependencies**: Does not use React, Vue, jQuery, Tailwind, or any external libraries.

## Live Demo

https://project-fpce1.vercel.app?_vercel_share=cEBHu9Uc6hK0OBIYnNJd7J79UiUwYfTM

## Deployment Instructions

### Deploying to Vercel

1. **Install Vercel CLI (optional)**: `npm i -g vercel` or just use the Vercel website.
2. **Via Vercel Git Integration**:
   - Push this code to a GitHub/GitLab/Bitbucket repository.
   - Go to [Vercel](https://vercel.com).
   - Click **Add New...** -> **Project**.
   - Import your repository.
   - Leave the Framework Preset as "Other" and the root directory as is.
   - Click **Deploy**.

### Deploying to Netlify

1. **Via Netlify Drop**: 
   - Simply drag and drop the `kanban-app` folder onto the [Netlify Drop](https://app.netlify.com/drop) page.
2. **Via Git Integration**:
   - Push this code to a Git repository.
   - Log in to [Netlify](https://app.netlify.com).
   - Click **Add new site** -> **Import an existing project**.
   - Connect your Git provider and select your repo.
   - Leave "Build command" empty and "Publish directory" as `/` or whatever is appropriate if you adjust folder structure.
   - Click **Deploy Site**.
