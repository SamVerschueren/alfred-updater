'use strict';
const fs = require('fs');
const path = require('path');
const pify = require('pify');

const fsP = pify(fs);

exports.findSymlinks = dir => fsP.readdir(dir)
	.then(files => {
		const promises = files.map(file => {
			const filePath = path.join(dir, file);

			return fsP.lstat(filePath).then(stats => stats.isSymbolicLink() && filePath);
		});

		return Promise.all(promises).then(files => files.filter(Boolean));
	});

exports.toMessage = updates => {
	if (updates === 0) {
		return 'No workflows updated';
	}

	if (updates === 1) {
		return '1 workflow updated';
	}

	return `${updates} workflows updated`;
};
