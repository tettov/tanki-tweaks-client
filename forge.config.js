const { FusesPlugin } = require("@electron-forge/plugin-fuses");
const { FuseV1Options: FuseOptions, FuseVersion } = require("@electron/fuses");

const package = require("./package.json");

module.exports = {
    plugins: [
        new FusesPlugin({
            version: FuseVersion.V1,
            [FuseOptions.RunAsNode]: false,
            [FuseOptions.EnableCookieEncryption]: true,
            [FuseOptions.EnableNodeOptionsEnvironmentVariable]: false,
            [FuseOptions.EnableNodeCliInspectArguments]: false,
            [FuseOptions.EnableEmbeddedAsarIntegrityValidation]: true,
            [FuseOptions.OnlyLoadAppFromAsar]: true
        })
    ],
    packagerConfig: {
        executableName: package.name,
        asar: true,
        icon: "./resources/icons/icon",
        appCategoryType: "public.app-category.action-games"
    },
    makers: [
        {
            name: "@electron-forge/maker-deb",
            config: (arch) => {
                return {
                    options: {
                        maintainer: "Niced <tettovs@gmail.com>",
                        icon: "./resources/icons/icon.png",
                        categories: ["Game"],
                        section: "games",
                        homepage: "https://discord.gg/hJn2QeJsT3",
                    }
                };
            }
        },
        {
            name: "@electron-forge/maker-dmg",
            config: (arch) => {
                return {
                    name: `tanki-online-${package.version}-${arch}`,
                    icon: "./resources/icons/icon.icns"
                };
            }
        },
        {
            name: "@electron-forge/maker-squirrel",
            config: (arch) => {
                return {
                    setupExe: `tanki-online-${package.version}-${arch}.exe`,
                    iconUrl: "https://github.com/tettov/tanki-tweaks-client/main/resources/icons/icon.ico",
                    setupIcon: "./resources/icons/icon.ico"
                };
            }
        }
    ]
};
