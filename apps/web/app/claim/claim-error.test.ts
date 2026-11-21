import { describe, expect, it } from "vitest";
import { classifyClaimError } from "./claim-error";

describe("classifyClaimError", () => {
  it("keeps pre-send network/RPC errors as maybeSent=false with their own message", () => {
    const connectErr = classifyClaimError(new Error("fetch failed"), false);
    expect(connectErr).toEqual({
      kind: "unknown",
      message: "fetch failed",
      maybeSent: false,
      raw: "fetch failed",
    });

    const timeoutErr = classifyClaimError(new Error("Request timed out"), false);
    expect(timeoutErr.maybeSent).toBe(false);
    expect(timeoutErr.message).toBe("Request timed out");
  });

  it("preserves pre-check failure reasons verbatim with maybeSent=false", () => {
    const precheck = "Arbitrum says this mint would fail: message already received";
    const classified = classifyClaimError(new Error(precheck), false);
    expect(classified).toEqual({
      kind: "unknown",
      message: precheck,
      maybeSent: false,
      raw: precheck,
    });
  });

  it("still classifies pre-send wallet declines and popups as cancelled notices", () => {
    const declined = classifyClaimError({ code: 4001, message: "User rejected" }, false);
    expect(declined.kind).toBe("declined");
    expect(declined.maybeSent).toBe(false);
  });

  it("marks ambiguous network/timeout failures after sendClaim/submit as maybeSent=true", () => {
    const dropped = classifyClaimError(new Error("socket hang up"), true);
    expect(dropped.kind).toBe("network");
    expect(dropped.maybeSent).toBe(true);

    const timedOut = classifyClaimError(new Error("Request timed out"), true);
    expect(timedOut.kind).toBe("timeout");
    expect(timedOut.maybeSent).toBe(true);
  });

  it("keeps post-submit wallet declines and on-chain reverts accurate", () => {
    const declined = classifyClaimError({ code: 4001, message: "User rejected" }, true);
    expect(declined.kind).toBe("declined");
    expect(declined.maybeSent).toBe(false);

    const reverted = classifyClaimError(new Error("execution reverted"), true);
    expect(reverted.kind).toBe("onchain");
    expect(reverted.maybeSent).toBe(false);
  });
});
