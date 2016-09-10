'use strict';
const path = require('path');
const fs = require('fs');
const alfredNotifier = require('alfred-notifier');
const resolveAlfredPrefs = require('resolve-alfred-prefs');
const readPkg = require('read-pkg');
const latestVersion = require('latest-version');
const semver = require('semver');
const execa = require('execa');
const utils = require('./lib/utils');

const output = [];

alfredNotifier();

const update = pkg => execa('npm', ['install', '-g', pkg.name]).catch(err => {
	output.push(err.message);
});

const checkAndUpdate = filePath => readPkg(filePath)
	.then(pkg => {
		if (!pkg.name || !pkg.version) {
			return;
		}

		return latestVersion(pkg.name)
			.then(version => {
				if (semver.gt(version, pkg.version)) {
					return update(pkg);
				}
			})
			.catch(() => { });
	});

resolveAlfredPrefs()
	.then(prefs => {
		const workflowDir = path.join(prefs, 'workflows');

		// Retrieve all the symlinks from the workflows directory
		return utils.findSymlinks(workflowDir);
	})
	.then(filePaths => {
		// Iterate over all the workflows, check if they are outdated and update them
		const promises = filePaths.map(filePath => checkAndUpdate(filePath));

		return Promise.all(promises);
	})
	.then(result => {
		if (output.length > 0) {
			throw new Error(output.join('\n'));
		}

		console.log(utils.toMessage(result.filter(Boolean).length));
	})
	.catch(err => {
		fs.writeFileSync('output', err.message);
		console.log('Something went wrong');
	});
