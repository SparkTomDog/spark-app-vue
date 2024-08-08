import { app, shell, BrowserWindow } from "electron";
import { join } from "path";
import { electronApp, optimizer, is } from "@electron-toolkit/utils";
import icon from "../../resources/icon.png?asset";
import windowStateKeeper from "electron-window-state";
import "../common/database/databaseInit"
import "../common/dataIPC"

let mainWindow: BrowserWindow | null

function createWindow(): void {
    const mainWindowState = windowStateKeeper({
        defaultWidth: 1600,
        defaultHeight: 900
    })
    mainWindow = new BrowserWindow({
        width: mainWindowState.width,
        minWidth: 1000,
        height: mainWindowState.height,
        minHeight: 600,
        x: mainWindowState.x,
        y: mainWindowState.y,
        show: false,
        autoHideMenuBar: true,
        ...(process.platform === "linux" ? { icon } : {}),
        webPreferences: {
            preload: join(__dirname, "../preload/index.js"),
            sandbox: false,
        },
    });

    mainWindow.on("ready-to-show", () => {
        mainWindow?.show();
    });

    mainWindow.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url);
        return { action: "deny" };
    });

    if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
        mainWindow.webContents.openDevTools({
            mode: "bottom"
        })
        mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
    } else {
        mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
    }

    mainWindowState.manage(mainWindow)
}

app.whenReady().then(() => {
    // Set app user model id for windows
    electronApp.setAppUserModelId("com.spark");

    app.on("browser-window-created", (_, window) => {
        optimizer.watchWindowShortcuts(window);
    });

    createWindow();

    app.on("activate", function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
        mainWindow = null
    }
});
