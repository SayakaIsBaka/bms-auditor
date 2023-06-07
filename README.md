# bms-auditor

A fully client-side web application to check for common mistakes during BMS production. Based off w's checklist: https://wcko87.github.io/bms-checklist/

Live version available here: https://sayakaisbaka.github.io/bms-auditor

## Current features
- Encoding check
- Max grid partition check
- Keysound length check
- ASCII file / folder names check
- OGG keysound check
- Separate OGG BMS check

## TODO
- basically everything else in the checklist
- actually make a proper UI
- maybe offer conversion features (movie transcode, wav to ogg)
- drag and drop
- show notification if error

## Credits
- Encoding detection slightly modified from bemuse-chardet: https://github.com/bemusic/bemuse-chardet
- BMS difference check tool modified from https://stairway.sakura.ne.jp/smalltools/minibmsplay/diff.htm
