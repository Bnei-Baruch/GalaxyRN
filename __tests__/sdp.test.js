/**
 * @format
 * Unit tests for the pure SDP-munging helpers in src/tools.js (H.265 / H.264 / MediaTek).
 * All are string-in / string-out — no native deps.
 */

import {
  addH265ProfileToSDP,
  parseSDPCodecs,
  parseH265Profile,
  optimizeH264ForMediaTek,
  forceSoftwareDecoding,
  reduceVideoComplexity,
} from '../src/tools';

const SDP_H265 = [
  'v=0',
  'm=video 9 UDP/TLS/RTP/SAVPF 96 97',
  'a=rtpmap:96 H265/90000',
  'a=rtpmap:97 H264/90000',
  'a=fmtp:97 profile-level-id=42e01f;packetization-mode=1',
].join('\n');

const SDP_NO_H265 = [
  'v=0',
  'm=video 9 UDP/TLS/RTP/SAVPF 97',
  'a=rtpmap:97 H264/90000',
  'a=fmtp:97 profile-level-id=42e01f',
].join('\n');

// optimizeH264ForMediaTek / reduceVideoComplexity key off the codec token being present
// ON THE fmtp line itself (not the rtpmap line) — reproduce that so the branch executes.
const SDP_H264_FMTP = [
  'v=0',
  'a=rtpmap:97 H264/90000',
  'a=fmtp:97 H264 profile-level-id=42e01f;packetization-mode=1',
].join('\n');

describe('addH265ProfileToSDP', () => {
  it('inserts an fmtp line right after the H.265 rtpmap', () => {
    const out = addH265ProfileToSDP(SDP_H265).split('\n');
    const rtpmapIdx = out.findIndex(l => l.startsWith('a=rtpmap:96'));
    expect(out[rtpmapIdx + 1]).toContain('a=fmtp:96');
    expect(out[rtpmapIdx + 1]).toContain('profile-id=1');
    expect(out[rtpmapIdx + 1]).toContain('level-id=93');
  });

  it('leaves the SDP unchanged when no H.265 track is present', () => {
    expect(addH265ProfileToSDP(SDP_NO_H265)).toBe(SDP_NO_H265);
  });
});

describe('parseSDPCodecs', () => {
  it('maps codec name to payload type and parsed fmtp params', () => {
    const codecs = parseSDPCodecs(SDP_H265);
    expect(codecs.h264).toBeDefined();
    expect(codecs.h264.payloadType).toBe('97');
    expect(codecs.h264.parameters['profile-level-id']).toBe('42e01f');
    expect(codecs.h264.parameters['packetization-mode']).toBe('1');
  });

  it('returns an empty object when there are no fmtp lines', () => {
    expect(parseSDPCodecs('v=0\na=rtpmap:96 VP8/90000')).toEqual({});
  });
});

describe('parseH265Profile', () => {
  it('reports found:true and the payload type for an H.265 track', () => {
    const p = parseH265Profile(SDP_H265);
    expect(p.found).toBe(true);
    expect(p.payloadType).toBe('96');
  });

  it('reports found:false when no H.265 track is present', () => {
    expect(parseH265Profile(SDP_NO_H265)).toEqual({ found: false });
  });
});

describe('optimizeH264ForMediaTek', () => {
  it('rewrites the H.264 fmtp line to the conservative baseline profile', () => {
    const out = optimizeH264ForMediaTek(SDP_H264_FMTP);
    const fmtp = out.split('\n').find(l => l.startsWith('a=fmtp:97'));
    expect(fmtp).toContain('profile-level-id=42001e');
    expect(fmtp).toContain('max-br=768');
    // The rtpmap line must survive untouched.
    expect(out).toContain('a=rtpmap:97 H264/90000');
  });

  it('leaves fmtp lines that do not carry the codec token untouched', () => {
    expect(optimizeH264ForMediaTek(SDP_H265)).toBe(SDP_H265);
  });
});

describe('forceSoftwareDecoding', () => {
  it('strips hardware-hint extmap lines but keeps everything else', () => {
    const sdp = [
      'a=rtpmap:97 H264/90000',
      'a=extmap:4 urn:3gpp:video-orientation',
      'a=extmap:5 http://example/framemarking',
      'a=extmap:6 urn:ietf:params:rtp-hdrext:sdes:mid',
    ].join('\n');
    const out = forceSoftwareDecoding(sdp).split('\n');
    expect(out).not.toContain('a=extmap:4 urn:3gpp:video-orientation');
    expect(out.some(l => l.includes('framemarking'))).toBe(false);
    expect(out).toContain('a=extmap:6 urn:ietf:params:rtp-hdrext:sdes:mid');
    expect(out).toContain('a=rtpmap:97 H264/90000');
  });
});

describe('reduceVideoComplexity', () => {
  it('appends conservative caps to the H.264 fmtp line', () => {
    const out = reduceVideoComplexity(SDP_H264_FMTP);
    const fmtp = out.split('\n').find(l => l.startsWith('a=fmtp:97'));
    expect(fmtp).toContain('max-fs=1200');
    expect(fmtp).toContain('max-mbps=11880');
    expect(fmtp).toContain('max-br=384');
    // Original params retained.
    expect(fmtp).toContain('profile-level-id=42e01f');
  });
});
