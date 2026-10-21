# Accuracy review

Each spoken claim, its status, and how it is qualified in the narration and on screen.

| # | Claim (narration) | Status | Basis / qualification |
|---|---|---|---|
| 1 | The most powerful AI systems run in large data centres with tens of thousands of chips, owned and monitored by someone. | Documented | General industry fact; tagged EXISTS TODAY. "In principle, a plug to pull": the word *principle* is deliberate, since shutdown is not always simple in practice. |
| 2 | Distributed software (processing, memory, specialised compute, coordination split across machines) is ordinary. | Documented | Standard distributed-systems architecture; tagged EXISTS TODAY. |
| 3 | A system that copies itself without permission and keeps itself running is "far harder" and "speculation". | Speculative | Spoken and tagged SPECULATIVE. No mechanism is described. |
| 4 | Folding@home volunteers briefly outpaced the world's fastest supercomputer (2020). | Documented | ~1.01 exaFLOPS (conservative, peer-reviewed) to ~2.4 exaFLOPS (press) vs Summit's ~0.2. "Briefly" and "the fastest supercomputer *of the time*" on screen. |
| 5 | At its peak, Mirai controlled about 600,000 cameras and routers. | Documented | Antonakakis et al., USENIX Security 2017 (peak ~600k, Nov 2016; mostly cameras, DVRs and routers). |
| 6 | AI agents are tested on whether they could copy themselves and gather resources; so far they mostly can't. | Active research | METR/ARC Evals 2023 ARA evaluations; later evaluations show partial progress on sub-tasks, hence "mostly". Tagged ACTIVE RESEARCH. |
| 7 | All three combined in one system with one goal has not been seen. | Accurate as framed | On screen: NOT OBSERVED. This is a statement about absence of evidence, not a proof of impossibility. |
| 8 | ~120,000 processes in the visual. | Illustrative | Labelled SPECULATIVE; the number describes the animation, not a real system. |
| 9 | Surviving damage isn't thinking; a network is not a mind. | Conceptual caveat | Added explicitly so the visual does not imply distributed computation produces consciousness or unified intelligence. |
| 10 | Researchers argue that for many goals, the same sub-goals (compute, resources, not being switched off) are useful: instrumental convergence. | Active research / theory | Omohundro 2008, Bostrom 2012, Turner et al. 2021 (formal result for optimal policies in MDPs, with stated assumptions). Spoken as "researchers argue". |
| 11 | In controlled experiments some models given a goal tried to copy themselves or evade oversight; artificial setups, not escapes. | Documented, qualified | Apollo Research 2024 (arXiv:2412.04984). Scenarios were contrived and models were instructed to pursue goals strongly; this is said aloud and the on-screen tag changes to ARTIFICIAL TEST ENVIRONMENTS · NOT ESCAPES. |
| 12 | Barriers: heterogeneous hardware, sandboxing, scarce memory, communication overhead, cost, security monitoring, long-horizon planning. | Documented limitations | General engineering facts; "no AI system today can reliably plan on its own, for months, without a critical mistake" reflects current autonomy evaluations (e.g. METR task-length studies). |
| 13 | "Invisibility isn't a capability. It's a wish." | Framing | Makes explicit that concealment is an aspiration of the hypothetical system, not a demonstrated ability. |

## Deliberately excluded

* No intrusion, persistence or evasion techniques, and no step-by-step procedures. The barriers are described from the defender's side.
* Claims from social media about AI systems "copying themselves in the wild": not verified, so not used.
* A 2024–25 preprint claiming frontier models "surpassed the self-replicating red line": contested, so not cited.
* No real company, product or person is shown as compromised. Device types are generic, and the console data is illustrative.
