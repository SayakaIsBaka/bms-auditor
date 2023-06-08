import { DiffChart, DiffEntry } from "./types";
import BmsResource from "./bms_diff";

function FindNoteResult(result, note) {
    this.result = result;
    this.note = note;
}

function findNote(note, target, targetIdx, precision, mode, baseWav, targetWav) {
    var i,
        first,
        ret;
    try {
        if (note.isChild) {
            return new FindNoteResult(0, null);
        }
        first = parseInt(Math.floor((note.ms - precision) / 4000), 10);
        if (first < 0) {
            first = 0;
        }
        
        if (targetIdx[first] == null) {
            first = 0;
        }
        
        for (i = targetIdx[first]; i < target.length; i++) {
            if ((note.ms - precision) > target[i].ms) {
                continue;
            } else if ((note.ms + precision) < target[i].ms) {
                break;
            } else if (target[i].isChild) {
                continue;
            }
            switch (true) {
            case (note.lane === "01"):
            case ("11" <= note.lane && note.lane <= "19"):
            case ("21" <= note.lane && note.lane <= "29"):
            case ("51" <= note.lane && note.lane <= "59"):
            case ("61" <= note.lane && note.lane <= "69"):
                switch (true) {
                case (target[i].lane === "01"):
                case ("11" <= target[i].lane && target[i].lane <= "19"):
                case ("21" <= target[i].lane && target[i].lane <= "29"):
                case ("51" <= target[i].lane && target[i].lane <= "59"):
                case ("61" <= target[i].lane && target[i].lane <= "69"):
                    if (mode === 0) {
                        if (note.note === target[i].note) {
                            return new FindNoteResult(0, null);
                        }
                    } else {
                        // ファイル名比較
                        if (baseWav[note.note] === targetWav[target[i].note]) {
                            return new FindNoteResult(2, target[i]);
                        }
                    }
                    break;
                }
                break;
            default:
                if (note.lane === target[i].lane && note.note === target[i].note) {
                    return new FindNoteResult(0, null);
                }
            }
        }
    } catch (e) {
        alert(e.message);
        console.log(e);
    }
    ret = new FindNoteResult(1, null);
    if (mode === 0) {
        ret = findNote(note, target, targetIdx, precision, 1, baseWav, targetWav);
    }
    return ret;
}

function diffMain(selected, selectedBms, bms, precision, nosoundobj, bmsFiles) {
    try {
        var j,
            k,
            result,
            count,
            playDataIdx,
            ret;
        let res = [];
        
        for (var i = 0; i < bms.length; i++) {
            result = [];
            playDataIdx = [];
            count = 0;

            // 曲情報
            const bmsPath = bmsFiles[i].webkitRelativePath;
            const bmsMd5 = bms[i].md5;
            const bmsGenre = bms[i].headerData.GENRE;
            const bmsTitle = bms[i].headerData.TITLE;
            const bmsSubtitle = bms[i].headerData.SUBTITLE;
            const bmsArtist = bms[i].headerData.ARTIST;
            const bmsSubartist = bms[i].headerData.SUBARTIST;
            const bmsNbObj = bms[i].playData.length.toString();

            // 選択ファイルの場合は以上
            if (selected === bmsPath) {
                continue;
            }
            
            // WAV定義
            let diffWavDef = [];
            for (j in selectedBms.wavData) {
                result = true;
                if (selectedBms.wavData[j]) {
                    if (bms[i].wavData[j]) {
                        if (selectedBms.wavData[j].split(".")[0] !== bms[i].wavData[j].split(".")[0]) {
                            result = false;
                        }
                    } else {
                        result = false;
                    }
                    if (!result) {
                        diffWavDef.push(j.toString());
                    }
                }
            }

            // BMP定義
            let diffBmpDef = [];
            for (j in selectedBms.bgaData) {
                result = true;
                if (bms[i].bgaData[j]) {
                    if (selectedBms.bgaData[j].split(".")[0] !== bms[i].bgaData[j].split(".")[0]) {
                        result = false;
                    }
                } else {
                    result = false;
                }
                if (!result) {
                    diffBmpDef.push(j.toString());
                }
            }
            
            // ノーツ比較
            let diffNotes = [];
            for (j = 0; j < bms[i].playData.length; j++) {
                k = parseInt(Math.floor(bms[i].playData[j].ms / 4000), 10);
                if (!isNaN(playDataIdx[k])) {
                    continue;
                } else {
                    playDataIdx[k] = j;
                }
            }
    
            for (j = 0; j < selectedBms.playData.length; j++) {
                if (!nosoundobj && !selectedBms.wavData[selectedBms.playData[j].note]) {
                    continue;
                }
                ret = findNote(selectedBms.playData[j], bms[i].playData, playDataIdx, precision, 0, selectedBms.wavData, bms[i].wavData);
                if (ret.result > 0) {
                    let diff = new DiffEntry(selectedBms.playData[j].measure.toString(), selectedBms.playData[j].lane, selectedBms.playData[j].note);
                    if (ret.result === 2) {
                        diff.note += "->" + ret.note.note.toString();
                    }
                    diffNotes.push(diff);
                    count++;
                }
            }

            let diffObj = new DiffChart(bmsPath, selected, diffWavDef, diffBmpDef, diffNotes)
            res.push(diffObj);
        }
        return res;
    } catch (e) {
        alert(e.message);
        console.log(e);
    }
}

const parseWait = async (selected, selectedBms, bms, precision, nosoundobj, bmsFiles) => {
    try {
        while (true) {
            let bRetry = false;
            for (var i = 0; i < bms.length; i++) {
                if (!bms[i].isParsed) {
                    bRetry = true;
                }
            }
        
            if (bRetry) {
                await new Promise(r => setTimeout(r, 1000));
            } else {
                break
            }
        }
        return diffMain(selected, selectedBms, bms, precision, nosoundobj, bmsFiles);
    } catch (e) {
        alert(e.message);
        console.log(e);
    }
}

export const bmsDiff = async (charts, precision = 1, compareBlankKeysounds = false) => {
    let bms = []
    let selectedBms = undefined;
    let selected = undefined;

    for (var c of charts) {
        let b = new BmsResource();
        b.parseBmsFile(c);
        bms.push(b);
        if (selectedBms === undefined) {
            selectedBms = b;
            selected = c.webkitRelativePath;
        }
    }

    if (selectedBms !== undefined) {
        return parseWait(selected, selectedBms, bms, precision, compareBlankKeysounds, charts);
    } else {
        console.log("Error: no BMS files loaded (this shouldn't happen)")
    }
};
