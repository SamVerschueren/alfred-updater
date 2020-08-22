'use strict';
const path = require('path');
const fs = require('fs');
const {spawn} = require('child_process');
const resolveAlfredPrefs = require('resolve-alfred-prefs');
const readPkg = require('read-pkg');
const latestVersion = require('latest-version');
const semver = require('semver');
const execa = require('execa');
const utils = require('./lib/utils');

const output = [];

const update = async pkg => {
	try {
		return await execa('npm', ['install', '-g', pkg.name]);
	} catch (error) {
		output.push(error.message);
	}
};

const checkAndUpdate = async filePath => {
	const pkg = await readPkg({cwd: filePath});

	if (!pkg.name || !pkg.version) {
		return;
	}

	try {
		const version = await latestVersion(pkg.name);

		if (semver.gt(version, pkg.version)) {
			return update(pkg);
		}
	} catch (_) {
		// Do nothing
	}
};

(async () => {
	let alfredVersion;

	try {
		const alfredPreferences = await resolveAlfredPrefs();

		alfredVersion = alfredPreferences.version || 4;

		const workflowDir = path.join(alfredPreferences.path, 'workflows');

		// Retrieve all the symlinks from the workflows directory
		const filePaths = await utils.findSymlinks(workflowDir);

		// Iterate over all the workflows, check if they are outdated and update them
		const promises = filePaths.map(filePath => checkAndUpdate(filePath));

		const result = await Promise.all(promises);

		if (output.length > 0) {
			throw new Error(output.join('\n'));
		}

		console.log(utils.toMessage(result.filter(Boolean).length));
	} catch (error) {
		fs.writeFileSync('output', error.message);
		console.log('Something went wrong');
	} finally {
		// Kill the Alfred application and restart it
		const process = spawn(`pkill Alfred && open -n -a 'Alfred ${alfredVersion}'`, {
			detached: true,
			stdio: 'ignore',
			shell: true
		});

		process.unref();
	}
})();
