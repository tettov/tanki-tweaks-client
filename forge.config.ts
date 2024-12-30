import FS from "fs";
import Path from "path";
import { ForgeConfig, ForgeMakeResult } from "@electron-forge/shared-types";
import { FusesPlugin } from "@electron-forge/plugin-fuses";
import { FuseV1Options, FuseVersion } from "@electron/fuses";

const packageJSON = JSON.parse(FS.readFileSync("./package.json",
    { encoding: "utf-8" }));

function includeResource(
    makeResults: Array<ForgeMakeResult>,
    platforms: ReadonlyArray<string> | string,
    resourcePath: string, artifactName: string):
    Array<ForgeMakeResult> {

    if (typeof platforms === "string")
        platforms = [platforms];

    for (const makeResult of makeResults) {
        if (!platforms.some((platform) =>
            platform === makeResult.platform ||
            platform === "*")) continue;
        const artifactPath = Path.resolve(
            Path.dirname(makeResult.artifacts[0]),
            artifactName);
        FS.copyFileSync(resourcePath, artifactPath);
        makeResult.artifacts.push(artifactPath);
    }
    return makeResults;
}

export default {
    plugins: [
        new FusesPlugin({
            version: FuseVersion.V1,
            [FuseV1Options.RunAsNode]: false,
            [FuseV1Options.EnableCookieEncryption]: true,
            [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
            [FuseV1Options.EnableNodeCliInspectArguments]: false,
            [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
            [FuseV1Options.OnlyLoadAppFromAsar]: true
        })
    ],
    packagerConfig: {
        executableName: packageJSON.name,
        asar: true,
        icon: "./resources/icons/icon",
        appCategoryType: "public.app-category.action-games"
    },
    makers: [
        {
            name: "@electron-forge/maker-deb",
            config: (arch: string) => ({
                options: {
                    maintainer: "Tanki Projects <tettovs@gmail.com>",
                    icon: "./resources/icons/icon.png",
                    categories: ["Game"],
                    section: "games",
                    homepage: "https://ttanki.com/tweaks",
                }
            })
        },
        {
            name: "@electron-forge/maker-dmg",
            config: (arch: string) => ({
                name: `to-${packageJSON.version}-darwin-${arch}`,
                background: "./resources/dmg-background.png",
                iconSize: 100,
                icon: "./resources/icons/icon.icns"
            })
        },
        {
            name: "@electron-forge/maker-squirrel",
            config: (arch: string) => ({
                setupExe: `to-${packageJSON.version}-win32-${arch}.exe`,
                iconUrl: `https://github.com/tettov/tanki-tweaks-client/releases/download/${packageJSON.version}/squirrel-icon-${packageJSON.version}.ico`,
                setupIcon: "./resources/icons/icon.ico"
            })
        }
    ],
    hooks: {
        postMake: async (config, makeResults) => {
            includeResource(makeResults, "win32",
                "./resources/icons/icon.ico",
                `squirrel-icon-${packageJSON.version}.ico`);
            return makeResults;
        }
    },
    publishers: [
        {
            name: "@electron-forge/publisher-github",
            config: {
                repository: {
                    owner: "tettov",
                    name: "tanki-tweaks-client"
                },
                tagPrefix: "",
                draft: false
            }
        }
    ]
} satisfies ForgeConfig;
