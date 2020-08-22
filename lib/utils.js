'use strict';
const fs = require('fs');
const path = require('path');
const pify = require('pify');

const fsP = pify(fs);

exports.findSymlinks = async dir => {
	const files = await fsP.readdir(dir);

	const promises = files.map(async file => {
		const filePath = path.join(dir, file);

		const stats = await fsP.lstat(filePath);

		if (stats.isSymbolicLink()) {
			return filePath;
		}
	});

	const symlinks = await Promise.all(promises);

	return symlinks.filter(Boolean);
};

exports.toMessage = updates => {
	if (updates === 0) {
		return 'No workflows updated';
	}

	if (updates === 1) {
		return '1 workflow updated';
	}

	return `${updates} workflows updated`;
};
