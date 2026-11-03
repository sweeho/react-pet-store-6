# PLAN — SWHR2-T-0342

Cause: the 11 cases were uncited in the official run. Unit/integration tests already cite C-0293, 0294, 0296, 0297, 0299; the six e2e cases (C-0021, 0026, 0028, 0295, 0298, 0300) had no browser test citing their key. Fix: put keys in the existing e2e titles and add three browser tests (0295, 0298, 0300) to e2e/localization.spec.ts. No production change.
