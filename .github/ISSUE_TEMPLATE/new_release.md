---
name: New release
about: "[wazuh-team] Track the effort of the team to release a new version of Wazuh"
title: Support for Wazuh 4.x.x
labels: enhancement
assignees: ''

---

## Description

Example:
> Wazuh 4.3.8 will be released shortly. Our app for Splunk needs to support this new version. From our side, no changes will be included, so we only need to bump the version.

## Tasks

### Pre-release
- [ ] Add support for Wazuh 4.x.x (bump).
- [ ] Generate the required tags.
- [ ] Generate packages.
- [ ] Test the packages, to verify they install, and the app works as expected.
- [ ] [Optional] Run Regression Testing (#issue) 
- [ ] Generate draft releases.
- [ ] Notify the @wazuh/cicd and @wazuh/content teams that the release is good to go, from our side.

### Post-release
- [ ] Make draft releases final and public.
- [ ] Sync branches.

### Supported versions

Same as on previous releases: listed on our [supported versions](https://github.com/wazuh/wazuh-splunk/blob/master/scripts/tag.py#L7-L13).
