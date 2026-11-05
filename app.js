// =============================================================
//  Adventskalender
// =============================================================

// Hvilket spill som ligger bak hver luke
const GAMES = {
  1: 'Wordle', 2: 'Zip', 3: 'Connies', 4: 'Pyralinks',
  5: 'Nonogram', 6: 'Strands', 7: 'Bikuben', 8: 'Pips',
  9: 'Wordle', 10: 'Zip', 11: 'Pyralinks', 12: 'Connies',
  13: 'Stort nonogram', 14: 'Strands', 15: 'Sudoku', 16: 'Bikuben',
  17: 'Pyralinks', 18: 'Wordle', 19: 'Zip', 20: 'Dobbel runde: Connies',
  21: 'Nonogram', 22: 'Sudoku', 23: 'Strands', 24: 'Finalen'
};

// Plassering på forsiden: [luke, kolonne, rad]
const LAYOUT = [
  [7, '1', '1'], [15, '2', '1'], [3, '3', '1 / span 2'], [20, '4', '1'],
  [11, '1', '2'], [1, '2', '2'], [18, '4', '2 / span 2'],
  [9, '1 / span 2', '3'], [22, '3', '3'],
  [5, '1', '4 / span 2'], [13, '2', '4'], [24, '3 / span 2', '4'],
  [17, '2', '5'], [2, '3', '5'], [10, '4', '5'],
  [19, '1', '6'], [6, '2 / span 2', '6'], [14, '4', '6 / span 2'],
  [23, '1', '7'], [12, '2', '7 / span 2'], [4, '3', '7'],
  [16, '1', '8'], [21, '3', '8'], [8, '4', '8']
];

// Innholdet i hver luke. Svarene er kodet (base64) så de ikke står i klartekst.
const PUZZLES = {
  1: { type: 'ordgjetting', answer: 'S0FLQU8=' },
  9: { type: 'ordgjetting', answer: 'UElBTk8=' },
  2: {
    type: 'zip',
    size: 8,
    numbers: [[2, 1, 1], [4, 7, 2], [0, 1, 3], [1, 6, 4], [4, 1, 5], [5, 2, 6], [6, 1, 7], [5, 6, 8], [4, 3, 9], [5, 4, 10], [4, 5, 11], [5, 5, 12]],
    solution: 'WzE3LCAxNiwgMjQsIDMyLCA0MCwgNDgsIDU2LCA1NywgNTgsIDU5LCA2MCwgNjEsIDYyLCA2MywgNTUsIDQ3LCAzOSwgMzEsIDIzLCAxNSwgNywgNiwgNSwgNCwgMywgMiwgMSwgMCwgOCwgOSwgMTAsIDExLCAxMiwgMTMsIDE0LCAyMiwgMjEsIDIwLCAxOSwgMTgsIDI2LCAyNSwgMzMsIDM0LCA0MiwgNDEsIDQ5LCA1MCwgNTEsIDUyLCA1MywgNTQsIDQ2LCAzOCwgMzAsIDI5LCAyOCwgMjcsIDM1LCA0MywgNDQsIDM2LCAzNywgNDVd' // kun for testknappen
  },
  3: {
    type: 'connies',
    data: 'W3sidGl0bGUiOiAiR2F2ZXIgdmkgaGFyIGdpdHQgaHZlcmFuZHJlIiwgImNvbG9yIjogIiNFOEM3NjYiLCAid29yZHMiOiBbIktvcHAiLCAiQmxvbXN0ZXIiLCAiR2Vuc2VyIiwgIlNsaXBzIl19LCB7InRpdGxlIjogIkV0IGJhbmdlciBtw6VsdGlkIiwgImNvbG9yIjogIiM5Q0M5OEEiLCAid29yZHMiOiBbIlPDuHRwb3RldCIsICJBdm9rYWRvIiwgIkthcmJvbmFkZWRlaWciLCAiQ290dGFnZSBjaGVlc2UiXX0sIHsidGl0bGUiOiAiNC8xMCB0aW5nIGRlIGZsZXN0ZSBkZWx0YWdlcm5lIHRvayBtZWQgc2VnIHDDpSBBbG9uZSIsICJjb2xvciI6ICIjOURCRUU2IiwgIndvcmRzIjogWyJVbmRlcmJ1a3NlIiwgIlRhdSIsICJHcnl0ZSIsICJLbml2Il19LCB7InRpdGxlIjogIkRldCB2YXIgaWtrZSBlbiBiaWcgZGVhbCBlbiBnYW5nIChwbHVzcyBub2VuIGJva3N0YXZlciBmb3JhbikiLCAiY29sb3IiOiAiI0MzQTZFMCIsICJ3b3JkcyI6IFsiQm9yZGV0IiwgIsOYdmVyc3RlIiwgIkdyYXYiLCAiU2FsdCJdfV0='
  },
  4: {
    type: 'pyralinks',
    data: 'WyJybyIsICJzIiwgInAiLCAia3kiLCAidG9yIiwgInJpcyIsICJ1dGUiLCAibGxpbmciLCAic3MiLCAiZ2V0IiwgInNrIiwgImtha2UiLCAiZ3LDuHQiLCAibGl2IiwgInN0ZWQiXQ=='
  },
  6: {
    type: 'strands',
    data: 'eyJjbHVlIjoiRGVyIGRldCBza2plciIsImdyaWQiOlsiRVRTRUtTIiwiREhST1RBIiwiTkZPTUVNIiwiTEFCTkRGIiwiS0tBQlVNIiwiVE9ESEVJIiwiUk5HVMOYRyIsIlRPUkVTTCJdLCJzcGFuIjoiVFJPTkRIRUlNIiwid29yZHMiOnsiR0zDmFMiOltbNiw1XSxbNyw1XSxbNiw0XSxbNyw0XV0sIkZSRVNIIjpbWzIsMV0sWzEsMl0sWzAsM10sWzAsMl0sWzEsMV1dLCJCQUtLTEFOREVUIjpbWzQsM10sWzQsMl0sWzQsMV0sWzQsMF0sWzMsMF0sWzMsMV0sWzIsMF0sWzEsMF0sWzAsMF0sWzAsMV1dLCJLT01CTyI6W1swLDRdLFsxLDNdLFsyLDNdLFszLDJdLFsyLDJdXSwiU0FNRlVOREVUIjpbWzAsNV0sWzEsNV0sWzIsNV0sWzMsNV0sWzQsNF0sWzMsM10sWzMsNF0sWzIsNF0sWzEsNF1dLCJUT1JHRVQiOltbNywwXSxbNywxXSxbNywyXSxbNiwyXSxbNywzXSxbNiwzXV0sIlRST05ESEVJTSI6W1s1LDBdLFs2LDBdLFs1LDFdLFs2LDFdLFs1LDJdLFs1LDNdLFs1LDRdLFs1LDVdLFs0LDVdXX0sImV4dHJhIjpbIkFCQk9SIiwiQUJOT1JNIiwiQUJOT1JNRSIsIkFCTk9STVQiLCJBQk9SVCIsIkFGUk8iLCJBRlJPRU4iLCJBS0FOIiwiQUtFUiIsIkFLRVMiLCJBS0tBIiwiQUtURSIsIkFLVEVOIiwiQUtURU5PTSIsIkFLVEVSIiwiQUtURVJTIiwiQUtURVJTVCIsIkFLVEVSU1RFIiwiQUtURVMiLCJBS1RPUiIsIkFMS0EiLCJBTEtBTiIsIkFMS0FORVQiLCJBTEtPIiwiQU1FTiIsIkFNRU5BIiwiQU1FTk9SRSIsIkFNRVQiLCJBTVRFUiIsIkFOQkVUUk8iLCJBTkJVRCIsIkFOQlVERVQiLCJBTkRFIiwiQU5ERU1BVCIsIkFOREVNQVRFUiIsIkFOREVNT1IiLCJBTkRFVCIsIkFOREVUQUsiLCJBTkRFVEUiLCJBTkRNQVQiLCJBTkRNQVRFUiIsIkFTS0UiLCJBU0tFUiIsIkFTS0VUIiwiQVNLRVRFTiIsIkFTVEUiLCJBU1RFUlMiLCJBVE9NIiwiQkFIVCIsIkJBSFRFUiIsIkJBS0EiLCJCQUtBRk9SIiwiQkFLQkFORFQiLCJCQUtLIiwiQkFLS0EiLCJCQUtMQU5EIiwiQkFLTEFOREVUIiwiQkFLVCIsIkJBTEtPTkciLCJCQUxLT05HRVIiLCJCQU5EIiwiQkFOREUiLCJCQU5ERVQiLCJCQU5ERVRFIiwiQkFOREVUUyIsIkJBTkRUIiwiQkFORSIsIkJBTkVUIiwiQkFORVRFIiwiQkVHSSIsIkJFVEUiLCJCRVRFR04iLCJCRVRFUiIsIkJFVEVTIiwiQkVUUkUiLCJCRVRSRVMiLCJCRVRSTyIsIkJFVFJPUiIsIkJPTkEiLCJCT05EIiwiQk9OREUiLCJCT05FIiwiQk9ORVQiLCJCT05FVEUiLCJCT05NT1QiLCJCT05NT1RBIiwiQk9OTU9URVIiLCJCT05VTSIsIkJPTlVNRVQiLCJCT09LIiwiQk9PS0EiLCJCT09LRSIsIkJPT0tFUiIsIkJPT0tFUyIsIkJPT0tFVCIsIkJPT0tFVEUiLCJCT09NIiwiQk9PTUVOIiwiQk9PVFMiLCJCT09UU0EiLCJCT1JFIiwiQk9SRVMiLCJCT1JFU1RFRCIsIkJPUkVUIiwiQk9SRVRFIiwiQk9SVCIsIkJPUlRFIiwiQk9SVFNFIiwiQlVERU4iLCJCVURFVCIsIkJVREVUUyIsIkJVRE5FIiwiQlVFVCIsIkJVRVRFIiwiQlVGRSIsIkJVRkVBIiwiQlVOQUQiLCJCVU5ERVQiLCJEQUJCIiwiREFCQkEiLCJEQUJCRSIsIkRBQkJFVCIsIkRBQkJFVEUiLCJEQU5FIiwiREVNQVNLRVIiLCJERU1BU0tFUlQiLCJERU1BU0tFUlRFIiwiREVNTyIsIkRFTU9FUiIsIkRFTU9OIiwiREVNUiIsIkRFTVJFIiwiREVNUkVTIiwiREVNUkVUIiwiREVNVCIsIkRFTVRFIiwiREVUUyIsIkRPR0UiLCJET0dFUiIsIkRPS0siLCJET0tLQSIsIkRPTkciLCJET05HRVIiLCJET05PUiIsIkRPTlQiLCJET1JUIiwiRFVCQiIsIkRVQkJBIiwiRFVFVEUiLCJEVU5BIiwiRFVORSIsIkRVTkVUIiwiRFVORVRFIiwiRUJCQSIsIkVHTlQiLCJFR09BIiwiRUdTRVIiLCJFR1NFVCIsIkVLU0FNRU4iLCJFS1RBIiwiRUtURSIsIkVNTkEiLCJFTU9FUiIsIkVOQk8iLCJFTkJVIiwiRU5PUk0iLCJFTk9STVQiLCJFUkdPIiwiRVJNRSIsIkVSTUVUIiwiRVJPUyIsIkVST1QiLCJFUk9URU4iLCJFUlRFIiwiRVJUUyIsIkVTVEUiLCJFVEVSIiwiRVRFUyIsIkVUT1MiLCJFVE9TRVIiLCJFVFNBIiwiRVRTRSIsIkVUU0VSIiwiRVRTRVQiLCJFVFNFVEUiLCJGQUtBIiwiRkFLSyIsIkZBS0tBIiwiRkFLTCIsIkZBS1QiLCJGQUtUT1IiLCJGQUxLIiwiRkVETUUiLCJGRU1BS1RFUiIsIkZFTVRFIiwiRkVOQUQiLCJGRVRBIiwiRkVURSIsIkZFVEVSIiwiRkVURVJUIiwiRkVURVJURSIsIkZFVEVTIiwiRkVURVNUIiwiRkVURVNURSIsIkZFVE9TVCIsIkZMQUEiLCJGTEFCQiIsIkZMQUJCRVQiLCJGTEFCQkVURSIsIkZMQUsiLCJGTEFLQSIsIkZMQUtLIiwiRkxBS0tBIiwiRkxBS09ORyIsIkZMQUtPTkdFUiIsIkZMQUtUIiwiRkxBTiIsIkZPTkQiLCJGT05ERVQiLCJGT05EVUUiLCJGT05FTSIsIkZPTkVNQSIsIkZPUkUiLCJGT1JFS09NIiwiRk9SRUtPTU5FIiwiRk9SRVMiLCJGT1JFVCIsIkZPUkVUQSIsIkZPUkVUQUsiLCJGT1JFVEFLUyIsIkZPUkVUQVMiLCJGT1JFVEUiLCJGT1JFVE9LIiwiRk9STSIsIkZPUk1FIiwiRk9STUVOIiwiRk9STUVUIiwiRk9STUVURSIsIkZPUlNFIiwiRk9SU0VUQSIsIkZPUlNFVEUiLCJGT1JTVCIsIkZPUlNURUQiLCJGT1JUIiwiRk9SVEUiLCJGUkVLVCIsIkZSRVMiLCJGUkVTVCIsIkZSRVNURSIsIkZST00iLCJGUk9NVCIsIkZST1NUIiwiRlJPU1RFIiwiRlVORCIsIkdFUk9OVCIsIkdFU1QiLCJHTMOYU0UiLCJHTMOYU0VSIiwiR0zDmFNUIiwiR0zDmFNURSIsIkdPREEiLCJHT0RIRVQiLCJHT0RIRVRFUiIsIkdPRFQiLCJHT0RURSIsIkdPRFRFUiIsIkdPRFRFUyIsIkdPS0siLCJHT05PUkUiLCJHT1JPIiwiR09ST0EiLCJHUkVTIiwiR1JPUiIsIkhBS0EiLCJIQUtLIiwiSEFLS0EiLCJIQUtUIiwiSEFORCIsIkhBTkRNQUtUIiwiSEFORE1BS1RFUiIsIkhBTkRNQVQiLCJIQU5ETUFURSIsIkhBTkRNQVRFUiIsIkhBTkRNQVRFUyIsIkhBTkUiLCJIRUlNIiwiSEVURSIsIkhFVEVSIiwiSEVURVMiLCJIRVRTIiwiSEVUU0UiLCJIRVRTRVIiLCJIRVRTRVQiLCJIRVRTRVRFIiwiSE9NRSIsIkhPTU8iLCJIT01PRU4iLCJIT01PRVIiLCJIT09LIiwiSE9PS0VSIiwiSE9SRSIsIkhPUkVTIiwiSE9SRVQiLCJIT1JFVEUiLCJIT1JTIiwiSE9SU0UiLCJIT1JTRVQiLCJIT1JTRVRFIiwiSE9SU1QiLCJIT1JUIiwiSE9SVEUiLCJIVUJCIiwiSFVERU4iLCJIVUVUIiwiSFVJRSIsIkhVSUVUIiwiSFVJRVRFIiwiSFVORCIsIkhVTkRFIiwiSFVOREVNQVQiLCJIVU5ERU1BVEVSIiwiSMOYRVIiLCJIw5hHRSIsIkjDmEdTRVRFIiwiSMOYR1NUIiwiSMOYU1QiLCJIw5hTVEUiLCJIw5hTVEVSIiwiSMOYU1RSRUdOIiwiS0FCQSIsIktBQkFMIiwiS0FCQiIsIktBQkJBIiwiS0FCQkUiLCJLQUJCRVQiLCJLQUJCRVRFIiwiS0FLQSIsIktBS0FPIiwiS0FLTCIsIktBTEsiLCJLQUxLQSIsIktBTUUiLCJLQU5EIiwiS0FORSIsIktBTk8iLCJLQVNUIiwiS0FTVEUiLCJLQVNURU4iLCJLQVNURVIiLCJLQVNURVMiLCJLQVNUT1IiLCJLQVRFTiIsIktBVEVSIiwiS0xBQkIiLCJLTEFCQkEiLCJLTEFCQkUiLCJLTEFCQkVUIiwiS0xBQkJFVEUiLCJLTEFLIiwiS0xBS0EiLCJLTEFOIiwiS09EQSIsIktPR1JFIiwiS09LQSIsIktPS1QiLCJLT01FVCIsIktPTUVURVIiLCJLT01ORSIsIktPTkciLCJLT05HRSIsIktPTkdFUiIsIktPTkdPIiwiS09OR1JPIiwiS09OTyIsIktPTlQiLCJLT05UTyIsIktPTlRPUiIsIktPTlRPUkVUIiwiS09OVE9SRVRTIiwiS09OVFIiLCJLT1JFIiwiS09SRVMiLCJLT1JFVCIsIktPUkVURSIsIktPUk4iLCJLT1JPTkEiLCJLT1JTIiwiS09SU0UiLCJLT1JTRVQiLCJLT1JTRVRFIiwiS09SVCIsIktPUlRFIiwiS09SVE4iLCJLT1NFIiwiS09TRVIiLCJLT1NFVCIsIktPU0VURSIsIktPU1QiLCJLT1NURSIsIktPVEEiLCJLT1RFIiwiS09URU4iLCJLT1RFUiIsIkxBQkFOIiwiTEFCQiIsIkxBQkJBIiwiTEFCQkUiLCJMQUJCRVQiLCJMQUJCRVRFIiwiTEFLQSIsIkxBS0siLCJMQUtLQSIsIkxBTkQiLCJMQU5ERSIsIkxBTkRFVCIsIkxBTkRFVFMiLCJMw5hFUiIsIkzDmEdTVCIsIkzDmEdTVEUiLCJMw5hHU1RFUiIsIkzDmFNFIiwiTMOYU0VSIiwiTMOYU0dJIiwiTMOYU1QiLCJMw5hTVEUiLCJNQUtFIiwiTUFLRVIiLCJNQUtFUyIsIk1BS0VUIiwiTUFLRVRFIiwiTUFLUyIsIk1BS1QiLCJNQUtURSIsIk1BS1RFTiIsIk1BS1RFUiIsIk1BS1RFUyIsIk1BU0siLCJNQVNLRSIsIk1BU0tFUiIsIk1BU0tFUlQiLCJNQVNLRVJURSIsIk1BU0tFUyIsIk1BU0tFVCIsIk1BU0tFVEUiLCJNQVNLT1QiLCJNQVNLT1RFTiIsIk1BU0tPVEVSIiwiTUFTVCIsIk1BU1RFIiwiTUFTVEVOIiwiTUFTVEVSIiwiTUFTVEVTIiwiTUFURSIsIk1BVEVOIiwiTUFURVIiLCJNQVRFUyIsIk1BVE1PUiIsIk1BVE9TIiwiTUFUT1NFUiIsIk1FRE1PUiIsIk1FR0wiLCJNRUlHIiwiTUVNQSIsIk1FTU8iLCJNRU1PQSIsIk1FTU9FUiIsIk1FTU9FVCIsIk1FTkEiLCJNRVRFT1IiLCJNRVRFUiIsIk1FVFJPIiwiTUlHRSIsIk1JR0VUIiwiTU9CQiIsIk1PQkJBIiwiTU9CQkUiLCJNT0JCRVQiLCJNT0JCRVRFIiwiTU9FTiIsIk1PRVIiLCJNT0VUIiwiTU9SRSIsIk1PUkVTIiwiTU9SRVQiLCJNT1JFVEUiLCJNT1JGIiwiTU9STyIsIk1PUk9BIiwiTU9ST0VOIiwiTU9SUyIsIk1PUlNFIiwiTU9SU0VUIiwiTU9SU0VURSIsIk1PUlQiLCJNT1JURSIsIk1PU0UiLCJNT1NFUiIsIk1PU0VUIiwiTU9TRVRBSyIsIk1PU0VURSIsIk1PU1QiLCJNT1NURSIsIk1PU1RSRSIsIk1PVEEiLCJNT1RFIiwiTU9URU4iLCJNT1RFUiIsIk1PVFMiLCJNT1RTQSIsIk5BQkIiLCJOQUJCQSIsIk5BQkJFIiwiTkFCQkVUIiwiTkFCQkVURSIsIk5BQk8iLCJOQUJPUk9NIiwiTkFLSyIsIk5BS0tBIiwiTkVNVCIsIk5PS0siLCJOT01FIiwiTk9SRVQiLCJOT1JNIiwiTk9SUyIsIk5VQkIiLCJOVUJCQSIsIk5VRVQiLCJPRlJFIiwiT0ZSRVMiLCJPRlJFVCIsIk9GUkVURSIsIk9LRVIiLCJPS0tBIiwiT01FTiIsIk9NRU5BIiwiT05EQSIsIk9OREUiLCJPTkRFVCIsIk9ORFQiLCJPUkdFIiwiT1JHRVMiLCJPUkdFVCIsIk9SR0VURSIsIk9STUUiLCJPUk1FTiIsIk9STUVUIiwiT1JNRVRFIiwiT1NFUiIsIk9TRVQiLCJPU1RFIiwiT1RFUiIsIlJFR04iLCJSRUdOVCIsIlJFS0EiLCJSRUtTVCIsIlJFS1NURU4iLCJSRUtUIiwiUkVLVEUiLCJSRVNUIiwiUk9CQU5FIiwiUk9CQiIsIlJPQkJBIiwiUk9CQkUiLCJST0JCRVQiLCJST0JCRVRFIiwiUk9FTiIsIlJPRVMiLCJST0VUIiwiUk9FVEUiLCJST0dOIiwiUk9LRVQiLCJST0tLIiwiUk9LS0EiLCJST0tTIiwiUk9LU0EiLCJST01FTiIsIlJPTVQiLCJST05ETyIsIlJPTkciLCJST1JFVCIsIlJPUk8iLCJST1NFIiwiUk9TRVQiLCJST1NFVEUiLCJST1NUIiwiUk9TVEUiLCJST1RBIiwiUk9URSIsIlJPVEVOIiwiUk9URVMiLCJTQUtFIiwiU0FLRVIiLCJTQUtFUyIsIlNBS0VUIiwiU0FLRVRFIiwiU0FLVCIsIlNBS1RFIiwiU0FLVEVSIiwiU0FLVEVTIiwiU0FLVEVTVCIsIlNBS1RFU1RFIiwiU0FNRCIsIlNBTURFIiwiU0FNRSIsIlNBTUVOIiwiU0FNVCIsIlNFR04iLCJTRUtTIiwiU0VLU0EiLCJTRUtTQUVOIiwiU0VLU1QiLCJTRUtTVEVOIiwiU0VLVCIsIlNFS1RBIiwiU0VLVEVOIiwiU0VLVE9SIiwiU0VUQSIsIlNFVEUiLCJTRVRSIiwiU0hPUlQiLCJTS0FNIiwiU0tBVCIsIlNLQVRFIiwiU0tBVEVOIiwiU0tBVEVSIiwiU0tBVEVTIiwiU0tPRU4iLCJTS09SIiwiU0tPUkUiLCJTS09SVCIsIlNLT1JURSIsIlNLT1MiLCJTS09TRSIsIlNLT1NFUiIsIlNLT1NFVCIsIlNLT1NFVEUiLCJTS09TVCIsIlNLT1NURSIsIlNMw5hFIiwiU0zDmEVSIiwiU09NUkUiLCJTT01UIiwiU09SVCIsIlNPUlRFIiwiU09UQSIsIlNPVEUiLCJTT1RFTiIsIlNPVEVSIiwiU1RBRSIsIlNUQUsiLCJTVEFLRSIsIlNUQUtFUiIsIlNUQUtFUyIsIlNUQU0iLCJTVEVBIiwiU1RFQU0iLCJTVEVEIiwiU1RFRyIsIlNURUlHIiwiU1RFSyIsIlNURUtBIiwiU1RFTSIsIlNURU1OIiwiU1RFTU9SIiwiU1RFTiIsIlNURVIiLCJTVEVSVCIsIlNURVJURSIsIlNURVMiLCJTVE9SIiwiU1RPUkUiLCJTVE9SRVMiLCJTVE9SSEVUIiwiU1RPUk0iLCJTVE9STUUiLCJTVE9STUVOIiwiU1RPUlQiLCJTVFJFSyIsIlNUUkVLQSIsIlNUUkVLVCIsIlNUUkVLVEUiLCJTVFJFVEUiLCJTVFJPS0UiLCJTVMOYRSIsIlNUw5hFUiIsIlNUw5hMIiwiU8OYRVQiLCJTw5hURSIsIlPDmFRFUiIsIlPDmFRFUk9UIiwiVEFLUyIsIlRBTUUiLCJUQU1FTiIsIlRBTUZFIiwiVEFTS0UiLCJUQVNLRVIiLCJURUFLIiwiVEVBS0VSIiwiVEVBTSIsIlRFR0wiLCJURUdOIiwiVEVJRyIsIlRFS08iLCJURU1BIiwiVEVOT1IiLCJURVJHIiwiVEVSTSIsIlRFUk1FIiwiVEVSTUVOIiwiVEVSTU9TIiwiVEVSUyIsIlRFUlQiLCJURVJURSIsIlRFU09SVCIsIlRFU1QiLCJURVNURSIsIlRPRU4iLCJUT0VSIiwiVE9FUyIsIlRPR0UiLCJUT0dFUiIsIlRPR0VTIiwiVE9HRVQiLCJUT0dFVEUiLCJUT0tLIiwiVE9LS0EiLCJUT05UIiwiVE9SRSIsIlRPUkciLCJUT1JOIiwiVE9SVCIsIlRSRUciLCJUUkVLVCIsIlRSRUtURSIsIlRSRUtURU4iLCJUUkVTIiwiVFJFVEFLIiwiVFJPQSIsIlRST0UiLCJUUk9FTiIsIlRST0tFIiwiVFJPTSIsIlRST01CT05FIiwiVFJPTiIsIlRST05BIiwiVFJPTkUiLCJUUk9ORVQiLCJUUk9ORVRFIiwiVFJPUiIsIlRST1MiLCJUw5hFUiIsIlTDmFNFUiIsIsOYU0VSIiwiw5hTRVQiLCLDmFNURSIsIsOYU1RSRSIsIsOYU1RST04iXX0='
  },
  7: {
    type: 'bikuben',
    data: 'eyJjZW50ZXIiOiJPIiwib3V0ZXIiOlsiUyIsIkoiLCJLIiwiQiIsIsOGIiwiUiJdLCJ3b3JkcyI6WyJiam9yIiwiYm9rayIsImJva3MiLCJib29rIiwiYm9yayIsImJvcnNqIiwiYm9zbyIsImJvc3MiLCJicm9rIiwiYnJva2siLCJicm9yIiwiam9iYiIsImpvam8iLCJqb2trIiwia2pva3MiLCJram9zIiwia29rayIsImtva29zIiwia29rcyIsImtvcmJyb3IiLCJrb3JrIiwia29yciIsImtvcnMiLCJrb3JzYnJvciIsImtvc3MiLCJrcm9rIiwia3JvcyIsInJvYmIiLCJyb2trIiwicm9rb2trbyIsInJva3MiLCJyb3JvIiwic2pva2siLCJza2pvciIsInNrb2trIiwic2tvciIsInNrb3MiLCJzb2trIiwic29zcyIsInPDpnJibyIsInNqb2tvYsOmciJdfQ=='
  },
  8: {
    type: 'pips',
    data: 'eyJjZWxscyI6W1swLDNdLFswLDVdLFsxLDNdLFsxLDRdLFsxLDVdLFsyLDJdLFsyLDNdLFsyLDRdLFszLDBdLFszLDFdLFszLDJdLFszLDNdLFs0LDBdLFs0LDFdLFs0LDNdLFs0LDRdLFs1LDBdLFs1LDFdLFs1LDRdLFs1LDVdXSwicmVnaW9ucyI6W3siY2VsbHMiOltbMCw1XV0sInR5cGUiOiJzdW0iLCJuIjo1fSx7ImNlbGxzIjpbWzMsMF1dLCJ0eXBlIjoic3VtIiwibiI6NX0seyJjZWxscyI6W1s0LDFdXSwidHlwZSI6InN1bSIsIm4iOjV9LHsiY2VsbHMiOltbNSw1XV0sInR5cGUiOiJndCIsIm4iOjR9LHsiY2VsbHMiOltbMSw1XSxbMSw0XSxbMiw0XV0sInR5cGUiOiJndCIsIm4iOjl9LHsiY2VsbHMiOltbMiwzXSxbMywzXSxbMCwzXSxbMSwzXV0sInR5cGUiOiJzdW0iLCJuIjo1fSx7ImNlbGxzIjpbWzMsMV0sWzMsMl1dLCJ0eXBlIjoiZ3QiLCJuIjo3fSx7ImNlbGxzIjpbWzUsNF0sWzQsM10sWzQsNF1dLCJ0eXBlIjoibHQiLCJuIjo0fSx7ImNlbGxzIjpbWzUsMF0sWzUsMV1dLCJ0eXBlIjoiZXEiLCJuIjpudWxsfV0sImRvbWlub2VzIjpbWzAsNF0sWzAsMV0sWzQsNV0sWzAsNV0sWzIsM10sWzQsNF0sWzIsNV0sWzIsMl0sWzIsNl0sWzEsMV1dLCJzb2x1dGlvbiI6eyIwLDMiOjEsIjAsNSI6NSwiMSwzIjoxLCIxLDQiOjQsIjEsNSI6MiwiMiwyIjoyLCIyLDMiOjMsIjIsNCI6NCwiMywwIjo1LCIzLDEiOjQsIjMsMiI6NCwiMywzIjowLCI0LDAiOjAsIjQsMSI6NSwiNCwzIjowLCI0LDQiOjEsIjUsMCI6MiwiNSwxIjoyLCI1LDQiOjIsIjUsNSI6Nn0sInRpbGluZyI6W1tbMywzXSxbMywyXV0sW1s0LDNdLFs0LDRdXSxbWzMsMV0sWzMsMF1dLFtbNCwxXSxbNCwwXV0sW1syLDJdLFsyLDNdXSxbWzIsNF0sWzEsNF1dLFtbMSw1XSxbMCw1XV0sW1s1LDBdLFs1LDFdXSxbWzUsNF0sWzUsNV1dLFtbMSwzXSxbMCwzXV1dfQ=='
  },
  12: {
    type: 'connies',
    data: 'W3sidGl0bGUiOiAiUmltZXIgcMOlIGp1bCIsICJjb2xvciI6ICIjOUNDOThBIiwgIndvcmRzIjogWyJHdWwiLCAiS3VsIiwgIlNranVsIiwgIkZ1Z2wiXX0sIHsidGl0bGUiOiAiVGluZyBkdSBoYXIgZsOldHQgcMOlIGtyb2tlbiIsICJjb2xvciI6ICIjOURCRUU2IiwgIndvcmRzIjogWyJMYW5nZSIsICJMeXIiLCAiQnVubmVuIiwgIk1lZyJdfSwgeyJ0aXRsZSI6ICJJbm5laG9sZGVyIHRhbGxlbmUgMeKAkzQiLCAiY29sb3IiOiAiI0MzQTZFMCIsICJ3b3JkcyI6IFsiRW5nZWwiLCAiVG9tYXQiLCAiVHJlbmluZyIsICJTYWZpcmVyIl19LCB7InRpdGxlIjogIkFsbGUgb3JkZW5lIGJsaXIgZXQgbnl0dCBvcmQgaHZpcyBkdSBsZWdnZXIgcMOlIC1rYWtlIiwgImNvbG9yIjogIiNFOEM3NjYiLCAid29yZHMiOiBbIlJpcyIsICJQZXBwZXIiLCAiUGFubmUiLCAiS2rDuHR0Il19XQ=='
  },
  5: {
    type: 'nonogram',
    data: 'WyIuVS4uLi4uLi4uLi4uUlIiLCAiVVVVLi4uLi4uLi4uUlJMIiwgIi5VLi5ISC4uLi4uUlIuTCIsICIuLi5ISEhILi4uUlIuLkwiLCAiLi4uLkZGLi4uUlIuLi5MIiwgIi4uLi5GQi4uUlIuLi4uTCIsICIuLi5CQkJCUlIuLi4uLkwiLCAiLi5CQkJCLi4uLi4uLi5MIiwgIi4uLkJCQi4uLi4uLi4uTCIsICJXV1dXV1dXV1dXV1dXLkwiLCAiLlcuV1dXV1dXVy5XLi5MIiwgIi4uV1dXV1dXV1dXLi4uTCIsICJTUy4uU1NTLi5TUy4uTC4iLCAiLlNTUy4uLlNTUy5TUy5TIiwgIlNTU1NTU1NTU1NTU1NTUyJd',
    colors: {
      U: '#F6D27A', // sol
      H: '#E3B341', // sydvest
      F: '#F0C9A0', // ansikt
      B: '#D99A2B', // regnjakke
      R: '#8B5A2B', // fiskestang
      L: '#F3E6D3', // snøre
      W: '#B5713A', // båt
      S: '#3E7CB1'  // sjø
    }
  }
};

// Belønningen som vises når luken er løst.
// Alle luker får «Du klarte det ♥». Legg til en luke her for å ha en ekstra tekst under.
const REWARDS = {
  5: {
    title: 'Du klarte det \u2665\uFE0E',
    text: 'Knut på fisketur'
  }
};

const TONES = ['#6E1A2D', '#64172A', '#761F33'];
const YEAR = 2026;

// -------------------------------------------------------------
//  Dato: hvor mange luker er åpne i dag (norsk tid)?
//  For testing: legg til ?test=6 i adressen for å late som det er 6. desember.
//  HUSK: sett TEST_MODE til false før kalenderen sendes!
// -------------------------------------------------------------
const TEST_MODE = true;

function unlockedDays() {
  if (TEST_MODE) {
    const t = parseInt(new URLSearchParams(location.search).get('test'), 10);
    if (t >= 0 && t <= 24) return t;
  }
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Oslo', year: 'numeric', month: 'numeric', day: 'numeric'
  }).formatToParts(new Date());
  const get = (type) => parseInt(parts.find((p) => p.type === type).value, 10);
  const y = get('year'), m = get('month'), d = get('day');
  if (y > YEAR) return 24;
  if (y < YEAR || m < 12) return 0;
  return Math.min(d, 24);
}

// -------------------------------------------------------------
const $ = (id) => document.getElementById(id);
const today = unlockedDays();
let busy = false;
let toastTimer;

const STAR = '<svg class="star" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2.6 6.9L22 9.3l-5.8 4.6L18.2 21 12 17l-6.2 4 2-7.1L2 9.3l7.4-.4z"/></svg>';
const LOCK = '<svg class="lock" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';

function buildGrid() {
  const grid = $('grid');
  grid.innerHTML = '';
  LAYOUT.forEach(([n, col, row], i) => {
    const locked = n > today;
    const big = col.includes('span') || row.includes('span');

    const slot = document.createElement('div');
    slot.className = 'slot';
    if (big) slot.classList.add('big');
    if (locked) slot.classList.add('locked');
    if (n === today) slot.classList.add('today');
    slot.style.gridColumn = col;
    slot.style.gridRow = row;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'door-btn';
    btn.setAttribute('aria-label', locked
      ? `Luke ${n}, låst til ${n}. desember`
      : `Luke ${n}, ${GAMES[n]}`);

    const inner = document.createElement('span');
    inner.className = 'inner';
    inner.setAttribute('aria-hidden', 'true');

    const door = document.createElement('span');
    door.className = 'door';
    if (n < today) door.classList.add('ajar');
    door.style.background = TONES[i % TONES.length];
    door.innerHTML = (n === 24 ? STAR : '') + `<span class="num">${n}</span>` + (locked ? LOCK : '');

    btn.append(inner, door);
    btn.addEventListener('click', () => pick(n, slot, door));
    slot.append(btn);
    grid.append(slot);
  });

  $('today-label').textContent = today === 0
    ? 'Første luke åpner 1. desember'
    : `I dag: ${today}. desember`;
  $('progress-label').textContent = `${today} av 24 luker klare`;
  requestAnimationFrame(() => { $('bar-fill').style.width = `${(today / 24) * 100}%`; });
}

function pick(n, slot, door) {
  if (busy) return;
  if (n > today) {
    slot.classList.remove('shake');
    void slot.offsetWidth; // start animasjonen på nytt
    slot.classList.add('shake');
    showToast(`Tålmodighet! Luke ${n} åpner ${n}. desember`);
    return;
  }
  busy = true;
  slot.classList.remove('today');
  door.classList.remove('ajar');
  door.classList.add('open');
  setTimeout(() => { location.hash = `luke-${n}`; }, 950);
}

function showToast(text) {
  const t = $('toast');
  t.textContent = text;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 2200);
}

let cleanup = null;
const PLACEHOLDER = $('game-area').innerHTML;

function openGame(n) {
  $('game-date').textContent = `Luke ${n} · ${n}. desember`;
  $('game-day').textContent = n;
  $('game-name').textContent = GAMES[n];

  const area = $('game-area');
  const puzzle = PUZZLES[n];
  const game = puzzle && window.Games && window.Games[puzzle.type];
  if (cleanup) { cleanup(); cleanup = null; }
  $('game').classList.toggle('compact', !!game);
  if (game) {
    area.className = 'game-area playing';
    cleanup = game.mount(area, puzzle, n, (won) => showReward(n, won !== false));
  } else {
    area.className = 'game-area';
    area.innerHTML = PLACEHOLDER;
  }

  $('home').hidden = true;
  $('game').hidden = false;
  window.scrollTo(0, 0);
}

// won = false betyr at spillet ble tapt (f.eks. Wordle uten riktig ord)
function showReward(n, won = true) {
  const r = won ? (REWARDS[n] || { title: 'Du klarte det \u2665\uFE0E', text: '' }) : { title: 'Det gikk ikke denne gang. Bedre lykke til i morgen \u2665\uFE0E', text: '' };
  if (!r) return;
  if ($('game-area').querySelector('.reward')) return; // allerede vist
  const card = document.createElement('div');
  card.className = 'reward';
  card.innerHTML = `
    <svg class="reward-star" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2.6 6.9L22 9.3l-5.8 4.6L18.2 21 12 17l-6.2 4 2-7.1L2 9.3l7.4-.4z"/></svg>
    <p class="reward-title"></p>
    <p class="reward-text"></p>`;
  card.querySelector('.reward-title').textContent = r.title || 'Du klarte det \u2665\uFE0E';
  card.querySelector('.reward-text').textContent = r.text;
  if (!r.text) card.querySelector('.reward-text').remove();
  if (!won) card.classList.add('lost');
  $('game-area').append(card);
  setTimeout(() => card.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
}

function showHome() {
  busy = false;
  if (cleanup) { cleanup(); cleanup = null; }
  $('game').hidden = true;
  $('home').hidden = false;
  buildGrid();
}

function route() {
  const m = location.hash.match(/^#luke-(\d+)$/);
  const n = m ? parseInt(m[1], 10) : 0;
  if (n >= 1 && n <= today) {
    openGame(n);
  } else {
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
    showHome();
  }
}

$('back').addEventListener('click', () => {
  history.replaceState(null, '', location.pathname + location.search);
  showHome();
});
window.addEventListener('hashchange', route);

// -------------------------------------------------------------
//  Kun for testing: knapper for å starte på nytt og vise løsningen.
//  Vises bare når TEST_MODE er på og adressen har ?test=
//  Forsvinner automatisk når TEST_MODE settes til false.
// -------------------------------------------------------------
if (TEST_MODE && new URLSearchParams(location.search).has('test')) {
  const bar = document.createElement('div');
  bar.className = 'test-bar';
  const reset = document.createElement('button');
  reset.type = 'button';
  reset.className = 'test-btn';
  const solve = document.createElement('button');
  solve.type = 'button';
  solve.className = 'test-btn';
  solve.textContent = 'Test: vis løsning';
  bar.append(solve, reset);
  document.body.append(bar);

  const currentDay = () => {
    const m = location.hash.match(/^#luke-(\d+)$/);
    return m ? parseInt(m[1], 10) : 0;
  };

  const label = () => {
    const n = currentDay();
    reset.textContent = n ? `Test: start luke ${n} på nytt` : 'Test: nullstill alle luker';
    const p = n && PUZZLES[n];
    const g = p && window.Games && window.Games[p.type];
    solve.hidden = !(g && g.solvedState);
  };

  reset.addEventListener('click', () => {
    const n = currentDay();
    try {
      if (n) {
        localStorage.removeItem(`advent-${n}`);
      } else {
        Object.keys(localStorage)
          .filter((k) => k.startsWith('advent-'))
          .forEach((k) => localStorage.removeItem(k));
      }
    } catch (e) { /* ignorer */ }
    if (n) openGame(n);
    else showToast('Alle luker er nullstilt');
  });

  solve.addEventListener('click', () => {
    const n = currentDay();
    const p = PUZZLES[n];
    const g = p && window.Games[p.type];
    if (!g || !g.solvedState) return;
    try { localStorage.setItem(`advent-${n}`, JSON.stringify(g.solvedState(p))); } catch (e) { /* ignorer */ }
    openGame(n);
  });

  window.addEventListener('hashchange', label);
  $('back').addEventListener('click', label);
  label();
}

route();
