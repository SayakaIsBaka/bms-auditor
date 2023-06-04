"use strict";
/* utf-8 */
/*global clearInterval, clearTimeout, document, event, frames, history, Image, location, name, navigator, Option, parent, screen, setInterval, setTimeout, window, XMLHttpRequest, escape */
/*global alert, confirm, console, Debug, opera, prompt, WSH, URL */
/*global FileReader, FileReaderSync, Blob, webkitAudioContext, Uint8Array, requestAnimFrame */
/*global Gamepad, jsmpeg, PIXI, zip, jQuery, $ */
/*global BmsResource */
/*jslint plusplus: true, vars: true, bitwise: true, regexp: true,
forin: true, continue: true */

var dropBmsFiles = [];

function showHide(id) {
    if (document.getElementById(id).style.display === 'none') {
        document.getElementById(id).style.display = '';
    } else {
        document.getElementById(id).style.display = 'none';
    }
}

function showHideClass(e, cls) {
    if (e.target.checked) {
        $(cls).hide();
    } else {
        $(cls).show();
    }
}

function handleDragOver(e) {
    console.info("handleDragOver");
    e.stopPropagation();
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
}

function errorHandler(e) {
    console.log(e);
}

/* Traverse through files and directories */
function traverseFileTree(item, path) {
    try {
        var i, f;
        path = path || "";
        if (item.isFile) {
            // Get file
            console.info("drop file:" + path + item.name);
            f = item.file((function (dir) {
                return function (file) {
                    file.dirName = dir;
                    if (file.name.toLowerCase().match(/.*\.[bp]m[sel]/)) {
                        dropBmsFiles.push(file);
                        var bmsList = document.getElementById("list");
                        var elelabel = document.createElement('label');
                        var element = document.createElement('input');
    
                        element.name = "bmsfile";
                        element.type = "radio";
                        element.value = dir + file.name;

                        elelabel.appendChild(element);
                        elelabel.appendChild(document.createTextNode(dir + file.name));
                        elelabel.style.display = "block";
                        
                        bmsList.appendChild(elelabel);
                    }
                };
            })(path));
    
        } else if (item.isDirectory) {
            // Get folder contents
            console.info("drop directory:" + path);
            var dirReader = item.createReader();
            dirReader.readEntries(function (entries) {
                for (i = 0; i < entries.length; i++) {
                    traverseFileTree(entries[i], path + item.name + "/");
                }
            }, errorHandler);
        }
    } catch (e) {
        alert(e.message);
        console.log(e);
    }
}

function handleFileSelect(e) {
    try {
        var i, f;
        console.info("handleFileSelect");
        e.stopPropagation();
        e.preventDefault();
        if (e.dataTransfer.items) {
            for (i = 0; i < e.dataTransfer.items.length; i++) {
                f = e.dataTransfer.items[i].webkitGetAsEntry();
                traverseFileTree(f);
            }
        } else if (e.dataTransfer.files) {
            // firefox + webkit
            for (i = 0; i < e.dataTransfer.files.length; i++) {
                f = e.dataTransfer.files[i];
                f.dirName = "";
                if (f.name.toLowerCase().match(/.*\.[bp]m[sel]/)) {
                    dropBmsFiles.push(f);
                    var bmsList = document.getElementById("list");
                    var elelabel = document.createElement('label');
                    var element = document.createElement('input');

                    element.name = "bmsfile";
                    element.type = "radio";
                    element.value = f.name;
                    
                    elelabel.appendChild(element);
                    elelabel.appendChild(document.createTextNode(f.name));
                    elelabel.style.display = "block";
                    
                    bmsList.appendChild(elelabel);
                }
            }
        }
    } catch (ex) {
        alert(ex.message);
        console.log(ex);
    }
}

function main() {
    try {
        jQuery.event.props.push('dataTransfer');
        document.addEventListener("dragover", handleDragOver, false);
        document.addEventListener("drop", handleFileSelect, false);
    } catch (e) {
        alert(e.message);
        console.log(e);
    }
}

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

function diffMain(selected, selectedBms, bms, precision, nosoundobj) {
    try {
        var i,
            j,
            k,
            l,
            m,
            n,
            result,
            diffResult = document.getElementById("result"),
            ele,
            ele2,
            link,
            table,
            tr,
            td,
            count,
            playDataIdx,
            status = document.getElementById("status"),
            ret,
            maxDisso;
        
        // チェックボックス作成
        ele = document.createElement("label");
        ele.style.display = "block";
        ele2 = document.createElement("input");
        ele2.type = "checkbox";
        ele2.id = "wavnum";
        ele2.addEventListener('click', function (e) { showHideClass(e, ".wavnumchange"); }, false);
        
        ele.appendChild(ele2);
        ele.appendChild(document.createTextNode("WAV番号違いの同ファイルを無視する(※非推奨オプション)"));
        diffResult.appendChild(ele);

        
        ele = document.createElement("label");
        ele.style.display = "block";
        ele2 = document.createElement("input");
        ele2.type = "checkbox";
        ele2.id = "disso";
        ele2.checked = true;
        ele2.addEventListener('click', function (e) {showHideClass(e, ".dissoInfo"); }, false);
        
        ele.appendChild(ele2);
        ele.appendChild(document.createTextNode("小節内分解能情報を表示しない"));
        diffResult.appendChild(ele);
        
        for (i = 0; i < bms.length; i++) {
            result = [];
            playDataIdx = [];
            count = 0;

            // 曲情報
            ele = document.createElement("h3");
            ele.innerHTML = dropBmsFiles[i].dirName + dropBmsFiles[i].name;
            diffResult.appendChild(ele);

            ele2 = document.createElement("a");
            ele2.href = "http://www.dream-pro.info/~lavalse/LR2IR/search.cgi?mode=ranking&bmsmd5=" + bms[i].md5;
            ele2.innerHTML = "(" + bms[i].md5 + ")";
            ele.appendChild(ele2);

            
            if (bms[i].headerData.GENRE) {
                ele = document.createElement("b");
                ele.innerHTML = bms[i].headerData.GENRE;
                diffResult.appendChild(ele);
                diffResult.appendChild(document.createElement("br"));
            }

            if (bms[i].headerData.TITLE) {
                ele = document.createElement("b");
                ele.innerHTML = bms[i].headerData.TITLE;
                if (bms[i].headerData.SUBTITLE) {
                    ele.innerHTML += " " + bms[i].headerData.SUBTITLE;
                }
                diffResult.appendChild(ele);
                diffResult.appendChild(document.createElement("br"));
            }
            
            if (bms[i].headerData.ARTIST) {
                ele = document.createElement("b");
                ele.innerHTML = " " + bms[i].headerData.ARTIST;
                if (bms[i].headerData.SUBARTIST) {
                    ele.innerHTML += bms[i].headerData.SUBARTIST;
                }
                diffResult.appendChild(ele);
                diffResult.appendChild(document.createElement("br"));
            }
            diffResult.appendChild(document.createTextNode(bms[i].playData.length.toString() + " Objects"));
            diffResult.appendChild(document.createElement("br"));
            
            ele = document.createElement("div");
            ele.className = "dissoInfo";
            ele.style.display = "none";
            k = 0;
            maxDisso = 0;
            n = true;
            for (j in bms[i].measInfo) {
                l = 1;
                m = 1;
                if (bms[i].measInfo[j].soundDissolution !== 1) {
                    l = bms[i].measInfo[j].soundDissolution / bms[i].measInfo[j].length;
                }
                if (bms[i].measInfo[j].bgaDissolution !== 1) {
                    m = bms[i].measInfo[j].bgaDissolution / bms[i].measInfo[j].length;
                }
                if (l < m) {
                    l = m;
                }
                if (k !== l) {
                    k = l;
                    if (k <= 192) {
                        if (!bms[i].measInfo[j].useBmse) {
                            n = bms[i].measInfo[j].useBmse;
                            ele2 = document.createTextNode("Measure:" + j.toString() + "- Dissolution:1/" + k.toString() + " BMSEでは扱えない分解能です");
                        } else {
                            ele2 = document.createTextNode("Measure:" + j.toString() + "- Dissolution:1/" + k.toString());
                        }
                    } else {
                        ele2 = document.createElement("b");
                        ele2.innerHTML = "Measure:" + j.toString() + " Dissolution:1/" + k.toString();
                        ele2.style.color = "red";
                    }
                    ele.appendChild(ele2);
                    ele.appendChild(document.createElement("br"));
                    
                    if (maxDisso < k) {
                        maxDisso = k;
                    }
                }
            }
            diffResult.appendChild(ele);
            
            if (192 < maxDisso) {
                ele = document.createElement("b");
                ele.style.color = "red";
                if (maxDisso <= 10000) {
                    ele.innerHTML = "最大分解能:1/" + maxDisso.toString() + " BMSEで開くとずれます。iBMSCを使ってください。";
                } else if (10000 < maxDisso) {
                    ele.innerHTML = "最大分解能:1/" + maxDisso.toString() + " 全てのBMSエディタが使えません。テキストエディタを使ってください。";
                }
            } else {
                if (!n) {
                    ele = document.createElement("b");
                    ele.style.color = "red";
                    ele.innerHTML = "最大分解能:1/" + maxDisso.toString() + " BMSEで開くとずれます。iBMSCを使ってください。";
                } else {
                    ele = document.createTextNode("最大分解能:1/" + maxDisso.toString());
                }
            }
            diffResult.appendChild(ele);
            diffResult.appendChild(document.createElement("br"));

            // 選択ファイルの場合は以上
            if (selected === (dropBmsFiles[i].dirName + dropBmsFiles[i].name)) {
                continue;
            }
            
            // WAV定義
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
                        diffResult.appendChild(document.createTextNode("#WAV" + j.toString() + "の定義が異なります"));
                        diffResult.appendChild(document.createElement("br"));
                    }
                }
            }

            diffResult.appendChild(document.createElement("br"));
            // BMP定義
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
                    diffResult.appendChild(document.createTextNode("#BMP" + j.toString() + "の定義が異なります"));
                    diffResult.appendChild(document.createElement("br"));
                }
            }
            
            // ノーツ比較
            diffResult.appendChild(document.createElement("br"));
            
            table = document.createElement("table");
            tr = document.createElement("tr");
            
            td = document.createElement("th");
            td.innerHTML = "No";
            tr.appendChild(td);
    
            td = document.createElement("th");
            td.innerHTML = "Measure";
            tr.appendChild(td);
    
            td = document.createElement("th");
            td.innerHTML = "Lane";
            tr.appendChild(td);
            
            td = document.createElement("th");
            td.innerHTML = "Note";
            tr.appendChild(td);
            
            table.appendChild(tr);
            
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
                    tr = document.createElement("tr");
    
                    td = document.createElement("td");
                    td.innerHTML = (count + 1).toString();
                    tr.appendChild(td);
                    
                    td = document.createElement("td");
                    td.innerHTML = selectedBms.playData[j].measure.toString();
                    tr.appendChild(td);
                    
                    td = document.createElement("td");
                    td.innerHTML = selectedBms.playData[j].lane;
                    tr.appendChild(td);
                    
                    td = document.createElement("td");
                    td.innerHTML = selectedBms.playData[j].note;
                    
                    if (ret.result === 2) {
                        td.innerHTML += "->" + ret.note.note.toString();
                        tr.className = "wavnumchange";
                        tr.style.color = "lightgray";
                    }
                    tr.appendChild(td);
                    
                    //table.appendChild(tr);
                    table.appendChild(tr);
                    
                    count++;
                }
            }
    
            if (count <= 0) {
                diffResult.appendChild(document.createTextNode("ズレ、抜けありませんでした。"));
            } else {
                diffResult.appendChild(document.createTextNode("以下のノートがズレてたり抜けてます"));
                diffResult.appendChild(table);
            }
        }
        status.innerHTML = "complete.";
    } catch (e) {
        alert(e.message);
        console.log(e);
    }
}

function parseWait(selected, selectedBms, bms, precision, nosoundobj) {
    try {
        var i,
            bRetry = false;
        for (i = 0; i < bms.length; i++) {
            if (!bms[i].isParsed) {
                bRetry = true;
            }
        }
    
        if (bRetry) {
            setTimeout(parseWait, 1000, selected, selectedBms, bms, precision, nosoundobj);
            return;
        }
    
        diffMain(selected, selectedBms, bms, precision, nosoundobj);
    } catch (e) {
        alert(e.message);
        console.log(e);
    }
}

function diff() {
    try {
        var list = document.getElementsByName("bmsfile"),
            i,
            j,
            k,
            selected,
            selectedBms,
            bms = [],
            precision = parseInt(document.getElementsByName("prec")[0].value, 10),
            nosoundobj = document.getElementsByName("nosound")[0].checked,
            diffResult = document.getElementById("result"),
            status = document.getElementById("status");
    
        if (list.length < 2) {
            alert("比較するファイルがありません。");
            return;
        }
    
        for (i = 0; i < list.length; i++) {
            if (list[i].checked) {
                selected = list[i].value;
            }
        }
    
        if (!selected) {
            alert("選択されていません。");
            return;
        }
    
        for (i = 0; i < dropBmsFiles.length; i++) {
            bms[i] = new BmsResource();
            bms[i].parseBmsFile(dropBmsFiles[i]);
    
            if (selected === (dropBmsFiles[i].dirName + dropBmsFiles[i].name)) {
                selectedBms = bms[i];
            }
        }
    
        if (selectedBms) {
            while (diffResult.firstChild) {
                diffResult.removeChild(diffResult.firstChild);
            }
            status.innerHTML = "processing...";
            parseWait(selected, selectedBms, bms, precision, nosoundobj);
        } else {
            alert("unkown error.");
            return;
        }
    } catch (e) {
        alert(e.message);
        console.log(e);
    }

}

$(document).ready(main);