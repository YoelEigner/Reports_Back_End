const fs = require('fs');
var archiver = require('archiver');
const path = require('path');


exports.createZip = (res, arr) => {
    // create a file to stream archive data to.
    const output = fs.createWriteStream('report.zip');
    const archive = archiver('zip', {
        zlib: { level: 9 } // Sets the compression level.
    });

    // listen for all archive data to be written
    // 'close' event is fired only when a file descriptor is involved
    output.on('close', async function () {
        console.log(archive.pointer() + ' total bytes');

        // res.writeHead(200, {
        //     'Content-Type': 'application/zip',
        //     'Content-disposition': `attachment;filename=file.zip`,
        // }).end('report.zip')


        // res.download('report.zip');
        // await emptyFolder()




    });

    output.on('end', function () {
        console.log('Data has been drained');

    });
    archive.pipe(output);
    archive.directory('temp/', false)
    archive.finalize();


    archive.on('warning', function (err) {
        if (err.code === 'ENOENT') {
            // log warning
        } else {
            // throw error
            throw err;
        }
    });
    archive.on('error', function (err) {
        throw err;
    });

}

const emptyFolder = async () => {
    try {
        const directory = path.join(__dirname, '../temp')

        fs.readdir(directory, (err, files) => {
            if (err) throw err;

            for (const file of files) {
                fs.unlink(path.join(directory, file), err => {
                    if (err){
                        console.log(err)
                    };
                });
            }
        });
    } catch (err) {
        console.log(err);
    }
}