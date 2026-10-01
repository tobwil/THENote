# Licensing and attribution

THE Note is an independent open-source project maintained by [tobwil](https://github.com/tobwil).
Copyright © 2026 THE Note contributors for their original contributions.

**THE Note as a combined work is licensed under GNU GPL version 3 or, at your option, any later version (`GPL-3.0-or-later`).** You may use, study, modify and redistribute it under that license. See the unmodified [GPL text](LICENSE). The license includes conditions for distributing modifications and corresponding source, and provides no warranty.

## The two foundations

| Project | Authors / source | Contribution to THE Note | Original license |
| --- | --- | --- | --- |
| **Sarala** | **Srinivas Gowda** and Sarala contributors · [solancer/sarala](https://github.com/solancer/sarala) | The editor foundation: live Markdown, document state, tabs, native file handling, themes, export, tests and assets | **GPL-3.0-or-later** |
| **Ledge** | Ledge contributors · [ledgesh/ledge](https://github.com/ledgesh/ledge) | Executable-notebook inspiration and the copied frontmatter parser; THE Note's Rust process runner is a new implementation | **Apache-2.0** |

Thank you to both projects. Their work made THE Note possible. They are credited as upstream projects; no affiliation or endorsement is implied.

Sarala's copyright and license remain in force. The Ledge-derived [frontmatter parser](src/execution/ledge-frontmatter.ts) retains its Apache-2.0 notice; the [original Apache license](docs/upstream/LEDGE-LICENSE) and [upstream third-party notices](docs/upstream/LEDGE-THIRD-PARTY-NOTICES.md) are preserved. The latter describe Ledge's own distribution, not THE Note's dependency inventory.

Apache-2.0 code can be included in a GPLv3 combined work; see the [Apache Software Foundation's compatibility explanation](https://www.apache.org/licenses/GPL-compatibility.html). This does not turn the combined application into an Apache-2.0-only or MIT-licensed application. Third-party components retain their respective licenses.

## Provenance and changes

[NOTICE.md](NOTICE.md) identifies the exact upstream commits, the copied components and THE Note's changes. [CHANGELOG.md](CHANGELOG.md) documents subsequent releases. The original GPL and Apache license texts have not been rewritten to add project names; project-specific attribution lives in this file and NOTICE.md.

[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) records the installed production npm dependency closure and native macOS Rust dependency inventory used for this release. Collected license texts are under [licenses/third-party](licenses/third-party). Existing emoji and Unicode notices are retained in [licenses](licenses).

Contributions to THE Note's own code are submitted under GPL-3.0-or-later. Changes to separately licensed upstream code must retain the applicable original notices. Do not remove attribution when redistributing THE Note or its source.
