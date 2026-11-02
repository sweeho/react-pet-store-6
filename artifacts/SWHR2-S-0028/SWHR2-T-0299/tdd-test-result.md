# TDD result — SWHR2-T-0299

## Notes

Platform-recorded runs (ticket has linked cases). Red run id: 64a47b79-46df-4f95-a87f-0a738d7596de (valid; C-0255/C-0256 already passed). Green run id: c24b0f38-aeda-43eb-8cca-57dbde3e7086.

Red used stubs that throw `VortexNotImplemented`. The table and migration were not in the red commit (the platform refuses product code before red), so red tests seed through a service read first.
