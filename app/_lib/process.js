import { detectEncoding } from './chardet';
import { Issue, IssueType } from './types';
import { Reader, Compiler, Keysounds } from 'bms';
import { formatBytes, isAscii, toBase36 } from './utils';
import { bmsDiff } from './bms-diff/diff';

let issues = []

const checkEncoding = async (charts) => {
    for (var c of charts) {
        let encoding = await detectEncoding(c);
        console.log(encoding)
        if (encoding !== "Shift-JIS") {
            const issue = new Issue(IssueType.Encoding, c.name, encoding)
            issues.push(issue)
        }
      }
};

const checkMaxGridPartition = async (charts) => {
    for (var c of charts) {
        const chartStr = Reader.read(Buffer.from(await c.arrayBuffer()));
        const lines = chartStr.split(/\r\n|\n/);
        let maxGridPartition = 0;
        for (var l of lines) {
            l = l.trim();
            const regex = /^#[0-9][0-9][0-9][0-9A-F][0-9A-F]:/gi; // get measure lines
            if (l.match(regex)) {
                const curGridPartition = l.split(':').pop().length / 2; // only get part after measure / channel definition, divide in half to get grid partition
                maxGridPartition = curGridPartition > maxGridPartition ? curGridPartition : maxGridPartition;
            }
        }
        console.log("Max grid partition for " + c.name + ": " + maxGridPartition);
        if (maxGridPartition === 192) {
            const issue = new Issue(IssueType.MaxGridPartition, c.name, "");
            issues.push(issue);
        }
    }
};

const checkKeysound = async (folder, charts) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    console.log("Starting keysound length detection... (this takes a few seconds)")

    for (var c of charts) {
        const chartStr = Reader.read(Buffer.from(await c.arrayBuffer()));
        let chart = Compiler.compile(chartStr).chart;
        const keysounds = Keysounds.fromBMSChart(chart);
        const keysoundFiles = keysounds.files();
        let wavKeysounds = false;
        let separateKeysounds = false;
        for (var f of keysoundFiles) {
            let keysound = folder.find(e => e.name.toLowerCase() === f.toLowerCase());
            if (keysound === undefined) {
                const keysoundExtensions = [".wav", ".ogg", ".flac"];
                for (var i = 0; i < 3 && keysound === undefined; i++) {
                    keysound = folder.find(e => e.name.toLowerCase() === f.replace(/\.[^/.]+$/, keysoundExtensions[i]).toLowerCase());
                }
            } else {
                if (keysound.name.split('.').pop().toLowerCase() === "ogg" && !separateKeysounds) { // If ogg keysound is defined in the BMS and the file is found
                    const issue = new Issue(IssueType.SeparateOggBms, c.name, "");
                    issues.push(issue);
                    separateKeysounds = true;
                }
            }
            if (keysound === undefined) {
                console.log("Keysound not found in folder: " + f);
            } else {
                if (keysound.name.split('.').pop().toLowerCase() === "wav" && !wavKeysounds) { // If wav keysound is found
                    const issue = new Issue(IssueType.NonOggKeysounds, c.name, "");
                    issues.push(issue);
                    wavKeysounds = true;
                }
                const keysoundArrayBuffer = await keysound.arrayBuffer();
                try {
                    const audioBuffer = await audioContext.decodeAudioData(keysoundArrayBuffer);
                    if (audioBuffer.duration >= 60.0) {
                        if (issues.find(e => e.issueType === IssueType.KeysoundLength && e.file === keysound.name) === undefined) { // don't add if already reported
                            const issue = new Issue(IssueType.KeysoundLength, keysound.name, audioBuffer.duration + "s");
                            issues.push(issue);
                        }
                    }
                } catch (e) {
                    console.log("Could not decode keysound " + keysound.name + ", skipping...");
                    console.log(e)
                }
            }
        }
    }
};

const checkAsciiFilenames = (folder) => {
    const folderName = folder[0].directoryHandle.name
    if (!isAscii(folderName)) {
        const issue = new Issue(IssueType.NonAsciiFilename, folderName, "");
        issues.push(issue);
    }
    for (var file of folder) {
        const fileName = file.name
        if (!isAscii(fileName)) {
            const issue = new Issue(IssueType.NonAsciiFilename, fileName, "");
            issues.push(issue);
        }
    }
}

const checkBga = async (folder, charts) => {
    const maxSize = 40000000 // 40M

    for (var c of charts) {
        const chartStr = Reader.read(Buffer.from(await c.arrayBuffer()));
        let chart = Compiler.compile(chartStr).chart;
        for (var i = 1; i < 1296; i++) {
            let bmp = chart.headers.get("bmp" + toBase36(i));
            if (bmp !== undefined) {
                const bmpExtensions = ["wmv", "mpg", "mpeg", "png", "jpg", "jpeg", "bmp"];
                const curBmpExtension = bmp.split('.').pop().toLowerCase();
                if (!bmpExtensions.includes(curBmpExtension)) {
                    if (issues.find(e => e.issueType === IssueType.WrongBgaFormat && e.file === bmp) === undefined) {
                        const issue = new Issue(IssueType.WrongBgaFormat, bmp, curBmpExtension);
                        issues.push(issue);
                    }
                }
                let bmpFile = folder.find(e => e.name.toLowerCase() === bmp.toLowerCase());
                if (bmpFile === undefined) {
                    const bmpFallbackExtensions = [".png", ".jpg", ".bmp"];
                    for (var j = 0; j < 3 && bmpFile === undefined; j++) {
                        bmpFile = folder.find(e => e.name.toLowerCase() === bmp.replace(/\.[^/.]+$/, bmpFallbackExtensions[j]).toLowerCase());
                    }
                } else {
                    if (curBmpExtension === "mp4") { // If mp4 BGA is defined in the BMS and the file is found
                        const issue = new Issue(IssueType.Mp4BgaDefined, c.name, bmpFile.name);
                        issues.push(issue);
                    }
                }
                if (bmpFile === undefined) {
                    console.log("BMP file not found in folder: " + bmp);
                } else {
                    let mp4Fallback = undefined;
                    if (curBmpExtension !== "mp4") {
                        mp4Fallback = folder.find(e => e.name.toLowerCase() === bmp.replace(/\.[^/.]+$/, ".mp4").toLowerCase())
                    }
                    if (bmpFile.size > maxSize) {
                        if (issues.find(e => e.issueType === IssueType.LargeBgaFile && e.file === bmpFile.name) === undefined) {
                            const issue = new Issue(IssueType.LargeBgaFile, bmpFile.name, formatBytes(bmpFile.size, 1));
                            issues.push(issue);
                        }
                    }
                    if (mp4Fallback !== undefined && mp4Fallback.size > maxSize) {
                        if (issues.find(e => e.issueType === IssueType.LargeBgaFile && e.file === mp4Fallback.name) === undefined) {
                            const issue = new Issue(IssueType.LargeBgaFile, mp4Fallback.name, formatBytes(mp4Fallback.size, 1));
                            issues.push(issue);
                        }
                    }
                }
            }
        }
    }
}

const checkDiff = async (charts) => {
    const diffCharts = await bmsDiff(charts);
    for (var diff of diffCharts) {
        if (diff.diffNotes.length > 0 || diff.diffBmp.length > 0 || diff.diffWav.length > 0) {
            const issue = new Issue(IssueType.BmsDifference, diff.path, diff);
            issues.push(issue);
        }
    }
};

const checkHeaders = async (folder, charts) => {
    for (var c of charts) {
        const chartStr = Reader.read(Buffer.from(await c.arrayBuffer()));
        let chart = Compiler.compile(chartStr).chart;
        if (chart.headers.get("total") === undefined) {
            const issue = new Issue(IssueType.MissingTotal, c.name, "");
            issues.push(issue);
        }
        if (chart.headers.get("preview") === undefined && folder.filter(e => /^preview.*\.(ogg|wav)$/.test(e.name)).length < 1) {
            const issue = new Issue(IssueType.MissingPreview, c.name, "");
            issues.push(issue);
        }
        if (chart.headers.get("lnobj") !== undefined && chart.objects.all().filter(e => e.channel.startsWith("5") || e.channel.startsWith("6")).length > 0) {
            const issue = new Issue(IssueType.WrongLnType, c.name, "");
            issues.push(issue);
        }
    }
};

export const processFolder = async (folder) => {
    issues = []
    const bmsExtensions = ['bms', 'bme', 'bml', 'pms'];
    let charts = folder.filter(e => bmsExtensions.includes(e.name.split('.').pop().toLowerCase()));
    if (charts.length < 1) {
      alert("This folder does not contain any BMS files, please select a proper BMS folder!");
      return null;
    }

    await checkEncoding(charts);
    await checkMaxGridPartition(charts);
    await checkKeysound(folder, charts);
    checkAsciiFilenames(folder);
    await checkBga(folder, charts);
    await checkDiff(charts);
    await checkHeaders(folder, charts);

    console.log(issues)
    return issues
};
