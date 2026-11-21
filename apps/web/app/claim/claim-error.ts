import { formatError } from "../../lib/format-error";
import { type ClassifiedError, classifyWalletError } from "../../lib/wallet-error";

/**
 * Classifies errors caught during `/claim` actions (`claim-client.tsx` and `evm-claim.tsx`).
 *
 * Pre-send errors (`handedToWallet = false`: wallet connect, network switch, `isAlreadyMinted`,
 * `checkClaim`, `prepareClaim`, `buildMintTransaction`) have not broadcast anything on-chain:
 * declines still render as a calm cancelled notice, while network or pre-check errors preserve
 * their own message with `maybeSent: false`.
 *
 * Once a transaction is handed to the wallet (`sendClaim` / `submit`), `handedToWallet = true`
 * delegates to `classifyWalletError` so ambiguous transport/timeout failures warn `maybeSent: true`.
 */
export function classifyClaimError(err: unknown, handedToWallet: boolean): ClassifiedError {
  if (handedToWallet) {
    return classifyWalletError(err);
  }
  const classified = classifyWalletError(err);
  if (classified.kind === "declined" || classified.kind === "popup") {
    return classified;
  }
  const message = formatError(err);
  return {
    kind: "unknown",
    message,
    maybeSent: false,
    raw: message,
  };
}
