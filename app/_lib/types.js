export const Severity = Object.freeze({
	Critical: Symbol("Critical"),
	High: Symbol("High"),
	Medium: Symbol("Medium"),
	Low: Symbol("Low"),
    Informational: Symbol("Informational"),
    Unknown: Symbol("Unknown")
});

export const IssueType = Object.freeze({
	Encoding: {
        name: "Encoding is not Shift-JIS",
        severity: Severity.Medium,
        description: "The chart is not encoded using Shift-JIS. This will cause issues if using non-ASCII characters in the BMS (japanese characters for example)."
    },
    MaxGridPartition: {
        name: "Maximum grid partition is 192",
        severity: Severity.Low,
        description: "The detected maximum grid partition for the mentioned chart has been found to be 192, which is the default value in iBMSC / uBMSC / pBMSC. This can cause your BMS to sound different if you are using finer divisions."
    },
    KeysoundLength: {
        name: "Keysound length is over 60s",
        severity: Severity.High,
        description: "BMS with keysounds exceeding 60s in length are automatically blocked from LR2IR. Try to cut up keysounds where possible, even if they are not used in the chart."
    },
    NonAsciiFilename: {
        name: "Non-ASCII filename / folder name",
        severity: Severity.Low,
        description: "It is recommended to use ASCII characters for filenames in order to avoid compatibility issues, especially with non-japanese locale computers."
    },
    NonOggKeysounds: {
        name: "Non-OGG keysounds",
        severity: Severity.Medium,
        description: "It is recommended to use OGG keysounds as WAV keysounds are usually very large with little to no quality gain. Tools like oggenc2 or oggdropXPd can be used to convert keysounds to OGG."
    },
    SeparateOggBms: {
        name: "Separate OGG BMS",
        severity: Severity.High,
        description: "Keysounds were found to be defined as OGG in the BMS file. It is not needed to redefine the extension as BMS clients will automatically search for WAV / OGG files if the defined keysound was not found. Having different BMS files for different file formats will create duplicates in internet rankings, which is undesireable. This error can be ignored if only one format will be published."
    },
    WrongBgaFormat: {
        name: "Unsupported BGA format",
        severity: Severity.High,
        description: "The file format used for the BGA file is not supported by all BMS clients, which may cause issues during playback. It is recommended to use wmv / mpg for videos and png / jpg / bmp for images for maximum compatibility. The mp4 format can also be used for more modern clients but a wmv / mpg file should also be included for older clients as well."
    },
    Mp4BgaDefined: {
        name: "MP4 BGA file defined in the BMS",
        severity: Severity.Medium,
        description: "The BGA file defined in the BMS uses the mp4 format. While this format is supported by newer clients, older clients might not support it reliably. It is recommended to define the fallback movie file (wmv / mpg) in the BMS file as newer clients are able to find the mp4 file automatically if it has the same name."
    },
    LargeBgaFile: {
        name: "Large BGA file",
        severity: Severity.Medium,
        description: "The BGA file is over 40MB. It is recommended to keep it under that size in order to make the BMS package smaller and keep a smaller disk footprint."
    },
    BmsDifference: {
        name: "Differences in BMS found",
        severity: Severity.Medium,
        description: "Differences in keysound placement have been found between charts. When making charts of different difficulties using iBMSC / uBMSC / pBMSC, make sure that you have Disable vertical moves (D) checked when moving notes around. This is to prevent accidental upward/downward shifting of keysounds when charting."
    }
});

export const Issue = class {
    constructor(issueType, file, results) {
      this.issueType = issueType;
      this.file = file;
      this.results = results;
    }
  };

export const DiffEntry = class {
    constructor(measure, lane, note) {
        this.measure = measure;
        this.lane = lane;
        this.note = note;
    }
};

export const DiffChart = class {
    constructor(path, refPath, diffWav, diffBmp, diffNotes) {
        this.path = path;
        this.refPath = refPath;
        this.diffWav = diffWav;
        this.diffBmp = diffBmp;
        this.diffNotes = diffNotes;
    }
};
