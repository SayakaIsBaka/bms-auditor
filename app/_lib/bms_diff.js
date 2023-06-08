import MD5_hexhash from "./md5";

function gcd(x, y) {
    var a = x,
        b = y,
        r = a % b;
    
    while (r !== 0) {
        a = b;
        b = r;
        r = a % b;
    }
    return b;
}

function lcm(x, y) {
    return x * y / gcd(x, y);
}

// Structure
//NOTE:Bms Resource
export default function BmsResource() {
    this.md5 = "";
    this.registFiles = [];
    this.bmsdata = [];
    this.headerData = [];
    this.stopData = [];
    this.bpmData = [];
    
    this.wavData = [];
    this.bgaData = [];
    this.playData = [];

    this.wavRsrc = [];
    this.bgaRsrc = [];

    this.audioChBuf = [];
    this.loadCount = 0;
    this.isReady = function () {
        return (this.loadCount === 0);
    };
    
    this.measureInfo = function () {
        this.soundDissolution = 1;
        this.bgaDissolution = 1;
        this.length = 1;
        this.useBmse = true;
    };
    this.measInfo = [];
    //this.measureDissolution = [];
    //this.measureLength = [];
    this.isParsed = false;

	this.calcPlayData = function (noteData) {
	    var pd = [],
	        i,
            lnObj = [],
	        nd,
            pnd;
	    var mLength = 1, //小節長
	        mTime, //1小節の時間[ms]
            mTime4, //4分の4拍子時の長さ
	        nowTime = 0, //[ms]
	        nowBpm,
	        prevMeasure = 0.0,
            baseMeasure = 0.0,
            baseTime = 0,
	        diffMeasure;

        nowBpm = this.headerData.BPM;

        mTime4 = 60 * 1000 * 4 / nowBpm; //60s * 1000ms * (4notes * MeasureLength) / BPM
        mTime = mTime4 * mLength; //60s * 1000ms * (4notes * MeasureLength) / BPM
	    //{"measure": ms, "lane": lane, "note": note}
	    //{"ms": ms, "lane": lane, "note": note}
	    for (i = 0; i < noteData.length; i++) {
	        nd = noteData[i];
	        if (Math.floor(prevMeasure) !== Math.floor(nd.measure)) {
	            // 小節変更
                if ((nd.lane === "02" && mLength !== nd.note) || nd.lane !== "02") {
                    baseTime += (Math.floor(nd.measure) - baseMeasure) * mTime;
                    if(nd.lane !== "02") {
                        baseTime += (nd.measure - Math.floor(nd.measure)) * (60 * 1000 * 4 / nowBpm);
                    }
                    baseMeasure = nd.measure;
                } 
	            mLength = 1;
                mTime4 = 60 * 1000 * 4 / nowBpm;
	            mTime = mTime4 * mLength;
	        }
	        if (nd.lane === "02") {
	            // 02 Change Measure
	            mLength = nd.note;
                mTime4 = 60 * 1000 * 4 / nowBpm;
	            mTime = mTime4 * mLength;
                //baseTime += (nd.measure - baseMeasure) * mTime;
                //baseMeasure = nd.measure;
	        } else if (nd.lane === "03") {
	            // 03 Change BPM
                baseTime += (nd.measure - baseMeasure) * mTime;
                baseMeasure = nd.measure;
	            nowBpm = parseFloat(parseInt(nd.note, 16));
                mTime4 = 60 * 1000 * 4 / nowBpm;
	            mTime = mTime4 * mLength;
	        } else if (nd.lane === "08") {
	            // 08 exBPM
                baseTime += (nd.measure - baseMeasure) * mTime;
                baseMeasure = nd.measure;
	            nowBpm = parseFloat(this.bpmData[nd.note]);
                mTime4 = 60 * 1000 * 4 / nowBpm;
	            mTime = mTime4 * mLength;
	        }

            diffMeasure = nd.measure - baseMeasure;
            
            pnd = {
	            //"ms": Math.floor(nowTime),
                "ms": Math.floor(mTime * diffMeasure + baseTime),
	            "lane": nd.lane,
	            "note": nd.note,
                "measure": nd.measure
	        };

            if (("51" <= pnd.lane && pnd.lane <= "59") || ("61" <= pnd.lane && pnd.lane <= "69")) {
                if (lnObj[pnd.lane]) {
                    lnObj[pnd.lane].child = pnd;
                    lnObj[pnd.lane] = null;
                    pnd.isChild = true;
                } else {
                    lnObj[pnd.lane] = pnd;
                }
            }
            
            pd.push(pnd);
	        prevMeasure = nd.measure;

	        if (nd.lane === "09") {
	            // 09 STOP
	            nowTime += mTime4 * (parseInt(this.stopData[nd.note], 10) / 192);
                baseTime += mTime4 * (parseInt(this.stopData[nd.note], 10) / 192);
	        }
	    }

	    return pd;
	};

	this.parseNoteData = function (line) {
	    var notes = [],
	        data,
	        i,
	        measure,
	        lane,
	        note,
            dissolution = 0;
	    data = line.split(":");
	    if (data.length === 2) {
	        if (data[0].match("[0-9]{5}")) {
	            // ヘッダが正しい場合処理
	            measure = data[0].substring(0, 3);
	            lane = data[0].substring(3);
                
	            if (lane === "02") {
	                note = data[1];
	                notes.push({
	                    "measure": parseFloat(measure),
	                    "lane": lane,
	                    "note": parseFloat(note)
	                });
	            } else {
                    if ((data[1].length % 2) !== 0) {
                        // ノーツ部が2の倍数でない場合は強制的に末尾0補完
                        data[1] += "0";
                    }
                    
	                for (i = 0; i < data[1].length; i += 2) {
	                    note = data[1].substring(i, i + 2).toUpperCase();
	                    if (note === "00") {
	                        continue;
	                    }
	                    notes.push({
	                        "measure": (parseFloat(measure) + (i / data[1].length)),
	                        "lane": lane,
	                        "note": note
	                    });
	                }
                    dissolution = data[1].length / 2;
	            }
	        }
	    }

	    return {notes: notes, dissolution: dissolution};
	};

	this.parseBmsFile = function (f) {
	    var fr = new FileReader();
	    var frHash = new FileReader();
	    
	    fr.onloadend = (function (bms) {
            return function (e) {
                var str, i, j,
                    strline,
                    sepIdx, lineHead, rndnum = -1,
                    nestlevel = 0,
                    nestvalue = [],
                    tmpNote,
                    bmseMeasure = [1, 2, 3, 4, 6, 8, 12, 16, 24, 32, 48, 64, 96, 192];
                var noteData, tmpPd;
                
                console.info("parseBmsFile");
                
                //bms.md5 = CryptoJS.MD5(e.target.result);
                noteData = [];
                nestvalue.push(rndnum);
                str = e.target.result.split("\r\n");
                for (i = 0; i < str.length; i++) {
                    strline = str[i].trim();
                    if (strline.charAt(0) === '#') {
                        /* 後で考える
                        if (strline.indexOf("RANDOM") !== -1) {
                            nestValue[nestlevel] = Math.floor( Math.random() * 100 );
                        } else if(strline.indexOf("IF") !== -1) {
                        } else if(strline.indexOf("ELSE") !== -1) {
                        } else if(strline.indexOf("ENDIF") !== -1) {
                        }
                        */
                        if (strline.charAt(1) >= '0' && strline.charAt(1) <= '9') {
                            // 小節データ
                            strline = strline.split(/\s/)[0];
                            tmpNote = bms.parseNoteData(strline.substring(1));
                            if (tmpNote.notes.length > 0) {
                                noteData = noteData.concat(tmpNote.notes);
                                j = Math.floor(tmpNote.notes[0].measure);
                                if (!bms.measInfo[j]) {
                                    bms.measInfo[j] = new bms.measureInfo();
                                }
                                switch (tmpNote.notes[0].lane) {
                                case "02":
                                    bms.measInfo[j].length = tmpNote.notes[0].note;
                                    if (tmpNote.notes[0].note < (1/64) || tmpNote.notes[0].note % (1/64) !== 0 || tmpNote.notes[0].note > 16) {
                                        bms.measInfo[j].useBmse = false;
                                    }
                                    break;
                                case "04":
                                case "07":
                                    bms.measInfo[j].bgaDissolution = lcm(bms.measInfo[j].bgaDissolution, tmpNote.dissolution);
                                    break;
                                default:
                                    bms.measInfo[j].soundDissolution = lcm(bms.measInfo[j].soundDissolution, tmpNote.dissolution);
                                    break;
                                }
                            }
                        } else {
                            sepIdx = strline.indexOf(' ');
                            if (sepIdx === -1) {
                                continue;
                            }
                            lineHead = strline.substring(1, sepIdx).toUpperCase();
                            if (lineHead.indexOf("WAV") !== -1 && lineHead.length === 5) {
                                bms.wavData[lineHead.substring(3)] = strline.substring(sepIdx + 1);
                            } else if (lineHead.indexOf("BMP") !== -1 && lineHead.length === 5) {
                                bms.bgaData[lineHead.substring(3)] = strline.substring(sepIdx + 1);
                            } else if (lineHead.indexOf("BPM") !== -1 && lineHead.length === 5) {
                                bms.bpmData[lineHead.substring(3)] = strline.substring(sepIdx + 1);
                            } else if (lineHead.indexOf("STOP") !== -1 && lineHead.length === 6) {
                                bms.stopData[lineHead.substring(4)] = strline.substring(sepIdx + 1);
                            } else {
                                // Header
                                bms.headerData[lineHead] = strline.substring(sepIdx + 1);
                            }
                        }
                    }
                }
                for (i in bms.measInfo) {
                    if (bms.measInfo[i].bgaDissolution > 1 && bmseMeasure.indexOf(bms.measInfo[i].bgaDissolution / bms.measInfo[i].length) === -1) {
                        bms.measInfo[i].useBmse = false;
                    }
                    if (bms.measInfo[i].soundDissolution > 1 && bmseMeasure.indexOf(bms.measInfo[i].soundDissolution / bms.measInfo[i].length) === -1) {
                        bms.measInfo[i].useBmse = false;
                    }
                }
                                    
                var laneSort = function (x, y) {
                    // 02 Change Measure 
                    // 03 Change BPM 
                    // 08 exBPM
                    // 09 STOP
                    if (x.lane === "09") {
                        return 1;
                    } else if (y.lane === "09") {
                        return -1;
                    } else if (x.lane === "02") {
                        return -1;
                    } else if (y.lane === "02") {
                        return 1;
                    } else if (x.lane === "03" || x.lane === "08") {
                        if (y.lane === "08") {
                            return -1;
                        } else {
                            return 1;
                        }
                    } else if (y.lane === "03" || y.lane === "08") {
                        if (x.lane === "08") {
                            return 1;
                        } else {
                            return -1;
                        }
                    } else {
                        if (x.lane > y.lane) {
                            return 1;
                        } else {
                            return -1;
                        }
                    }
                };
    
                noteData.sort(function (x, y) {
                    if (x.measure > y.measure) {
                        return 1;
                    } else if (x.measure < y.measure) {
                        return -1;
                    } else {
                        return laneSort(x, y);
                    }
                });
                bms.headerData.BPM = parseInt(bms.headerData.BPM, 10);
                if (isNaN(bms.headerData.BPM)) {
                    bms.headerData.BPM = 130;
                }
                tmpPd = bms.calcPlayData(noteData);
                j = 0;
                for (i in tmpPd) {
                    bms.playData[j] = tmpPd[i];
                    j++;
                }
                
                bms.playData.sort(function (x, y) {
                    if (x.ms > y.ms) {
                        return 1;
                    } else if (x.ms < y.ms) {
                        return -1;
                    } else {
                        return laneSort(x, y);
                    }
                });
    
                var output = [];
                if (bms.headerData.TITLE) {
                    output.push("TITLE:", bms.headerData.TITLE, "<br>");
                }
                if (bms.headerData.SUBTITLE) {
                    output.push("SUBTITLE:", bms.headerData.SUBTITLE, "<br>");
                }
                if (bms.headerData.ARTIST) {
                    output.push("ARTIST:", bms.headerData.ARTIST, "<br>");
                }
                if (bms.headerData.SUBARTIST) {
                    output.push("SUBARTIST:", bms.headerData.SUBARTIST, "<br>");
                }
                if (bms.headerData.BPM) {
                    output.push("BPM:", bms.headerData.BPM, "<br>");
                }
                
                bms.isParsed = true;
            };
        })(this);
        
        frHash.onloadend = (function (bms) {
            return function (e) {
                bms.md5 = MD5_hexhash(e.target.result);
            };
        })(this);
        frHash.readAsBinaryString(f);

        fr.readAsText(f, "Windows-31J");
	};
}
