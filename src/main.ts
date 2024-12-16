import OS from "os";
import FS from "fs";
import Path from "path";
import { spawn } from "child_process";
import parseArgs from "minimist";
import { BrowserWindow, app as application, dialog, session, shell } from "electron";
import { createHash } from "crypto";
import { XMLParser } from "fast-xml-parser";
import FileDownloader from "nodejs-file-downloader";
import extractZip from "extract-zip";

const TANKI_ONLINE_URL = "https://tankionline.com/play/";
const EXTERNAL_BROWSER_URLS = [
    "https://discord.gg/hJn2QeJsT3",
    "https://ru.tankiforum.com/topic/320910/"
];
const TANKI_TWEAKS_EXTENSION_KEY =
    "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAjc6ZrxUpSuXqCI+J3a3F" +
    "BHExxjt4tp4cmVzBu226D8JQIak/XOZaHu4j6DnrC9F7yFGC5KZDx9rXeSpJqhuh" +
    "a7e8buyFSTDK0BBmBfczOjBn3cIikUrEuKsbEnWUDGgbEGu8kUkcNaIVGYI/LQsK" +
    "i8NbGNojacVQ5oQby2Ckg/f06GKM4G3eS4ELzRzaOBwBdGLC2LQvCgXAiGPw3J5u" +
    "yo0AbulhbS1rHxnzvhf1iDVR1+Lii0wjHvSYGCFh88BLqv0QhkmtN57V6iYxwifM" +
    "LtmuoB9HXNHTfpxqbgoYRQkEarNEAZ1ErgwXNWZIqi541r9OOEbVTshS/GDeFD8Q" +
    "wwIDAQAB";

const options = parseArgs(process.argv.slice(1));

async function main() {

    if (require("electron-squirrel-startup")) {
        application.quit(); return;
    }
    if (OS.platform() === "win32" &&
        process.env.GPU_SET !== "true") {
        spawn(process.execPath, process.argv.slice(1), {
            detached: true,
            env: {
                ...process.env,
                SHIM_MCCOMPAT: "0x800000001",
                GPU_SET: "true"
            }
        });
        application.quit(); return;
    }

    application.commandLine.appendSwitch("disable-renderer-backgrounding");
    application.commandLine.appendSwitch("force_high_performance_gpu");
    application.commandLine.appendSwitch("ignore-gpu-blocklist");
    application.commandLine.appendSwitch("enable-gpu-rasterization");
    await application.whenReady();

    if (!(await canConnect(options.url ?? TANKI_ONLINE_URL))) {
        dialog.showErrorBox("Ошибка / Error",
            "Нет подключения к серверу игры.\n\n" +
            "Unable to connect to the game server.");
        application.quit(); return;
    }

    await updateAndLoadExtensions(application.getPath("userData"));
    createMainWindow();
}

async function canConnect(url: string,
    tries: number = 3): Promise<boolean> {

    for (let i = 0; i < tries; i++) {
        try {
            await fetch(url);
            return true;
        } catch (error) { }
    }
    return false;
}

function createMainWindow() {

    const window = new BrowserWindow({
        width: 1280,
        height: 800,
        title: "Tanki Online",
        titleBarStyle: OS.platform() === "darwin" ?
            "customButtonsOnHover" : "default",
        show: false
    });
    if (OS.platform() === "win32")
        window.setIcon(Path.join(application.getAppPath(),
            "resources/icons/icon.ico"));
    if (OS.platform() === "linux")
        window.setIcon(Path.join(application.getAppPath(),
            "resources/icons/icon.png"));
    window.setMenuBarVisibility(false);

    window.webContents.setWindowOpenHandler(
        ({ url }) => {
            if (EXTERNAL_BROWSER_URLS.includes(url)) {
                shell.openExternal(url);
                return { action: "deny" };
            }
            return { action: "allow" };
        });
    window.once("ready-to-show", () =>
        window.maximize());
    window.loadURL(options.url ?? TANKI_ONLINE_URL);
}

async function updateAndLoadExtensions(userDataPath: string) {

    const extensionsPath = Path.join(userDataPath, "extensions");
    if (!FS.existsSync(extensionsPath)) FS.mkdirSync(extensionsPath);

    const extensions = new Array<{ path: string; manifest: any }>();
    const directoryPaths =
        FS.readdirSync(extensionsPath, { withFileTypes: true })
            .filter((dirent) => dirent.isDirectory())
            .map((dirent) => Path.join(dirent.path, dirent.name));
    for (const directoryPath of directoryPaths) {
        try {
            const manifestPath = Path.join(directoryPath, "manifest.json");
            if (!FS.existsSync(manifestPath)) continue;
            const manifest = JSON.parse(FS.readFileSync(manifestPath,
                { encoding: "utf-8" }));
            extensions.push({ path: directoryPath, manifest });
        } catch (error) {
            console.log(error);
        }
    }

    if (extensions.find((extension) =>
        extension.manifest.key === TANKI_TWEAKS_EXTENSION_KEY) == null) {
        const tweaksExtension = {
            path: Path.join(extensionsPath, "tanki-tweaks"),
            manifest: {
                key: TANKI_TWEAKS_EXTENSION_KEY
            }
        };
        extensions.push(tweaksExtension);
    }

    for (const extension of extensions) {
        try {
            await updateExtension(extension);
            await session.defaultSession
                .loadExtension(extension.path);
        } catch (error) {
            console.log(error);
        }
    }
}

async function updateExtension(extension: { path: string; manifest: any }) {

    const manifest = extension.manifest;
    if (manifest.key == null) return;
    const extensionID = extensionKeyToID(manifest.key);
    const latestVersion = await getLatestExtensionVersion(extensionID,
        manifest.update_url);
    if (manifest.version === latestVersion.version) return;

    const crxPath = Path.join(application.getPath("temp"),
        extensionID + ".crx");
    const zipPath = Path.join(application.getPath("temp"),
        extensionID + ".zip");
    try {
        await new FileDownloader({
            url: latestVersion.crx,
            directory: Path.dirname(crxPath),
            fileName: Path.basename(crxPath),
            cloneFiles: false
        }).download();
        FS.writeFileSync(zipPath, unwrapCRX(FS.readFileSync(crxPath)));
        FS.rmSync(extension.path, { recursive: true, force: true });
        await extractZip(zipPath, { dir: extension.path });
    } finally {
        FS.rmSync(crxPath, { force: true });
        FS.rmSync(zipPath, { force: true });
    }
}

function extensionKeyToID(key: string): string {

    const keyDER = Buffer.from(key, "base64");
    const keyHash = createHash("sha256").update(keyDER)
        .digest("hex").substring(0, 32);
    let id = "";
    for (const char of keyHash)
        id += String.fromCharCode("a".charCodeAt(0) +
            parseInt(char, 16));
    return id;
}

async function getLatestExtensionVersion(
    id: string, updateURL: string =
        "https://clients2.google.com/service/update2/crx"
): Promise<{ version: string; crx: string }> {

    const os =
        OS.platform() === "win32" ? "win" :
            OS.platform() === "darwin" ? "mac" : "linux";
    const arch =
        OS.arch() === "ia32" ? "x86-32" :
            OS.arch() === "x64" ? "x86-64" :
                OS.arch().startsWith("arm") ? "arm" : "x86-64";

    const queryParams = {
        response: "updatecheck",
        os, arch, nacl_arch: arch,
        prod: "chromiumcrx",
        prodchannel: "unknown",
        prodversion: process.versions.chrome ?? "9999.0.9999.0",
        acceptformat: "crx2,crx3",
        x: `id=${id}&uc`
    };
    const queryString = "?" + new URLSearchParams(queryParams).toString();
    const updateResponse = await fetch(new URL(queryString, updateURL));

    const responseXML =
        new XMLParser({ ignoreAttributes: false })
            .parse(await updateResponse.text());
    const updatecheckTag = responseXML.gupdate?.app?.updatecheck;
    if (!(updatecheckTag != null &&
        "@_version" in updatecheckTag &&
        "@_codebase" in updatecheckTag))
        throw new Error("invalid update response");
    return {
        version: updatecheckTag["@_version"],
        crx: updatecheckTag["@_codebase"]
    };
}

function unwrapCRX(buffer: Buffer): Buffer {

    function readCRXVersion(buffer: Buffer):
        "crx-2" | "crx-3" | null {
        const version = buffer.readUInt32LE(4);
        if (version === 2) return "crx-2";
        if (version === 3) return "crx-3";
        return null;
    }

    if (buffer.readUInt32BE(0) === 0x50_4B_03_04)
        return Buffer.copyBytesFrom(buffer);
    if (buffer.readUInt32BE(0) !== 0x43_72_32_34)
        throw new Error("invalid CRX header");
    const version = readCRXVersion(buffer);
    if (version === null)
        throw new Error("unknown CRX version");
    const offset = version === "crx-2" ?
        16 + buffer.readUInt32LE(8) + buffer.readUInt32LE(12) :
        12 + buffer.readUInt32LE(8);
    return Buffer.copyBytesFrom(buffer, offset);
}

main();