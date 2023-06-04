const Severity = Object.freeze({
	Critical: Symbol("critical"),
	High: Symbol("high"),
	Medium: Symbol("medium"),
	Low: Symbol("low"),
    Informational: Symbol("informational"),
    Unknown: Symbol("unknown")
})

export const IssueType = Object.freeze({
	Encoding: {
        name: "Encoding",
        severity: Severity.Medium,
        description: "The chart is not encoded using Shift-JIS. This will cause issues if using non-ASCII characters in the BMS (japanese characters for example)."
    },
    MaxGridPartition: {
        name: "Maximum grid partition",
        severity: Severity.Low,
        description: "The detected maximum grid partition for the mentioned chart has been found to be 192, which is the default value in iBMSC / uBMSC / pBMSC. This can cause your BMS to sound different if you are using finer divisions."
    },
    KeysoundLength: {
        name: "Keysound length",
        severity: Severity.High,
        description: "BMS with keysounds exceeding 60s in length are automatically blocked from LR2IR. Try to cut up keysounds where possible, even if they are not used in the chart."
    },
    NonAsciiFilename: {
        name: "Non-ASCII filename",
        severity: Severity.Low,
        description: "It is recommended to use ASCII characters for filenames in order to avoid compatibility issues, especially with non-japanese locale computers."
    }
})

export const Issue = class {
    constructor(issueType, file, results) {
      this.issueType = issueType;
      this.file = file;
      this.results = results;
    }
  };