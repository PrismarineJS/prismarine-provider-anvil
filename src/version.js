const testedVersions = ['1.8.9', '1.9', '1.11.2', '1.12.2', '1.13.2', '1.14.4', '1.16', '1.17.1', '1.18.2', '1.19.4', '1.20.6', '1.21.1']
module.exports = {
  testedVersions,
  latestSupportedVersion: testedVersions[testedVersions.length - 1],
  oldestSupportedVersion: testedVersions[0]
}
