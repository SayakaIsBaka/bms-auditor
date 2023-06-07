import { detectEncoding } from './chardet';
import { Issue, IssueType } from './types';
import { Reader, Compiler, Keysounds } from 'bms';
import { isAscii } from './utils';

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
        for (var f of keysoundFiles) {
            let keysound = folder.find(e => e.name === f);
            if (keysound === undefined) {
                const keysoundExtensions = [".wav", ".ogg", ".flac"];
                for (var i = 0; i < 3 && keysound === undefined; i++) {
                    keysound = folder.find(e => e.name === f.replace(/\.[^/.]+$/, keysoundExtensions[i]));
                }
            }
            if (keysound === undefined) {
                console.log("Keysound not found in folder: " + f);
            } else {
                if (keysound.name.split('.').pop() === "wav" && !wavKeysounds) {
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

export const processFolder = async (folder) => {
    issues = []
    const bmsExtensions = ['bms', 'bme', 'bml', 'pms'];
    let charts = folder.filter(e => bmsExtensions.includes(e.name.split('.').pop()));
    if (charts.length < 1) {
      alert("This folder does not contain any BMS files, please select a proper BMS folder!");
      return null;
    }

    await checkEncoding(charts);
    await checkMaxGridPartition(charts);
    await checkKeysound(folder, charts);
    checkAsciiFilenames(folder);

    console.log(issues)
    return issues
};
