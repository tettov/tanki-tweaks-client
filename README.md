# Tanki Tweaks Client

Кастомный клиент для «Танков Онлайн» by Niced.

Поддержка и фидбек: [**Discord**](https://discord.gg/hJn2QeJsT3) • [**Тема на форуме**](https://ru.tankiforum.com/topic/320910/)

## Ключевые особенности

- Автоматическая установка и обновление [**Tanki Tweaks**](https://chromewebstore.google.com/detail/tanki-tweaks/khcoecipddmigggaeokhmhmhjhlpcpnb) из Магазина расширений Chrome.

- Актуальная версия движка с повышенной производительностью (особенно на macOS благодаря недавно добавленной поддержке Metal) и исправлением ошибок.

- Переработанный внешний вид окна и иконки на macOS.

- Поддержка пользовательских расширений.

- Запускается на Windows 10 и 11, macOS и Debian/Ubuntu.

## Установка

1. Получить установочный файл клиента, загрузив собранный мной, или почувствовать себя разработчиком и собрать его самостоятельно из исходных кодов. Инструкции ниже.

2. Установить.

3. Возможно, на ноутбуках с двумя видеокартами (встроенной и дискретной) потребуется настроить для клиента запуск на высокопроизводительном адаптере. Делается в настройках Windows или драйвера видеокарты.

## Готовые сборки

У приложения нет цифровой подписи и, скорее всего, ОС будет этим недовольна. Необходимо подтвердить установку и запуск специфичным для конкретной ОС способом.

Также есть возможность самостоятельно собрать deb-пакет для Linux - смотрите «Сборка из исходников».

**Windows:**
[**x64**](https://github.com/tettov/tanki-tweaks-client/releases/download/1.0.4/tanki-online-1.0.4-x64.exe) • [**ARM**](https://github.com/tettov/tanki-tweaks-client/releases/download/1.0.4/tanki-online-1.0.4-arm64.exe) • [**ia32**](https://github.com/tettov/tanki-tweaks-client/releases/download/1.0.4/tanki-online-1.0.4-ia32.exe)

**macOS:** [**ARM**](https://github.com/tettov/tanki-tweaks-client/releases/download/1.0.4/tanki-online-1.0.4-arm64.dmg) • [**x64**](https://github.com/tettov/tanki-tweaks-client/releases/download/1.0.4/tanki-online-1.0.4-x64.dmg)

> ⚠️ На macOS перед установкой необходимо очистить атрибуты скачанного файла командой `xattr -c <путь к dmg>` в Терминале, в противном случае клиент не запустится. Например, находясь в папке с файлом: `xattr -c ./tanki-online-1.0.4-arm64.dmg`

## Сборка из исходников

1. Установить [**Node.js**](https://nodejs.org/) и [**Git**](https://git-scm.com/). При установке оставляйте параметры по умолчанию, если не уверены в том, что делаете. **Перезагрузить компьютер.** Если собираете deb-пакет для Linux, то потребуются также **dpkg** и **fakeroot** (на Ubuntu ставятся командой `sudo apt install dpkg fakeroot`).

2. Запустить терминал (командную строку) в папке, где будет размещаться репозиторий.

3. Последовательно выполнить команды:
   ```shell
   git clone https://github.com/tettov/tanki-tweaks-client
   cd ./tanki-tweaks-client
   npm ci && npm run make
   ```

Если сборка пройдет успешно, где-то в папке `tanki-tweaks-client/out/make` появится установочный файл.

## Пользовательские расширения

Движок клиента (Electron) поддерживает ограниченный набор API расширений, почитать о котором можно [в официальной документации](https://www.electronjs.org/docs/latest/api/extensions#supported-extensions-apis). Случайные расширения работать вряд ли будут. Но, например, специально написанные для игры (такие, как Tanki Tweaks) возможно подключить к клиенту, добавив их в распакованном формате (директория с файлом *manifest.json*) в специальную папку:

**Windows**: `C:\Users\<имя пользователя>\AppData\Roaming\Tanki Online with Tweaks\extensions`

Быстро перейти в папку *Roaming* можно через поиск, набрав *%APPDATA%*.

**macOS**: `/Users/<имя пользователя>/Library/Application Support/Tanki Online with Tweaks/extensions`
