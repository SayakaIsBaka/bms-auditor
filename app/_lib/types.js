export const Severity = Object.freeze({
	Critical: Symbol("Critical"),
	High: Symbol("High"),
	Medium: Symbol("Medium"),
	Low: Symbol("Low"),
    Informational: Symbol("Informational"),
    Unknown: Symbol("Unknown")
})

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
    }
})

export const Issue = class {
    constructor(issueType, file, results) {
      this.issueType = issueType;
      this.file = file;
      this.results = results;
    }
  };