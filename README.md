# Builder World 3D

A small 3D town-building game starter. Walk around a 3D world, approach empty plots, choose a building, pay for it, and hire a three-person construction crew. Construction completes after a short timer.

## Controls

### Computer
- **W / A / S / D** or arrow keys: walk
- **Click the game** to lock the mouse, then move the mouse to look around
- **E**: open the build menu when standing near an empty plot
- **Escape**: release the mouse

### Phone
- Use the round control pad at bottom-left to walk.
- Drag the right side of the screen to look around.
- Walk close to a plot and tap **USE** to open its build menu.
- Turn your phone sideways for more room.

## Publish with GitHub Pages

1. Go to https://github.com and sign in.
2. Create a **Public** repository named `builder-world-3d`.
3. In the repository choose **Add file → Upload files**.
4. Extract this ZIP on your computer, open the `Builder_World_3D` folder, and upload all eight files inside it. Upload the files, not the ZIP.
5. Click **Commit changes**.
6. Open **Settings → Pages**.
7. Under **Build and deployment**, select **Deploy from a branch**.
8. Choose branch `main` and folder `/(root)`, then click **Save**.
9. Wait for GitHub Pages to publish. Your URL will look like `https://YOUR-USERNAME.github.io/builder-world-3d/`.

## Install on your phone

Open the published GitHub Pages address in Chrome on Android. Use Chrome's three-dot menu and choose **Install app** or **Add to Home screen**.

## Important notes

- This is a playable starter project, not a complete commercial 3D simulator.
- Three.js is loaded from a CDN, so the first time you open the game it needs an internet connection.
- The game currently has a starter town, six buildable plots, four building types, hireable crews, and timed construction.
- Progress is not saved between visits yet. A later version can add save/load, more building parts, roads, landscaping, crew management and missions.
- The construction crew is represented by simple 3D worker characters.
