'use strict';

exports.isStar = true;
exports.runParallel = runParallel;

/** Функция паралелльно запускает указанное число промисов
 * @param {Array} jobs – функции, которые возвращают промисы
 * @param {Number} parallelNum - число одновременно исполняющихся промисов
 * @param {Number} timeout - таймаут работы промиса
 * @returns {Array}
 */
function runParallel(jobs, parallelNum, timeout = 1000) {
    let result = [];
    jobs = jobs.map((job, index) => ({ run: job, index }));
    if (jobs === []) {
        return Promise.resolve([]);
    }

    let tasks = [];
    for (let i = 0; i < parallelNum; i++) {
        let newTask = next(jobs, result, timeout);
        if (newTask !== undefined) {
            tasks.push(newTask);
        }
    }

    return Promise.all(tasks).then(() => result);
}

function getNextTasks(jobs, timeout) {
    if (jobs.length) {
        let index = jobs[0].index;
        let currentPromise = jobs.shift();

        return {
            promise: new Promise(function (resolve, reject) {
                setTimeout(() => reject(new Error('Promise timeout')), timeout);
                currentPromise.run().then(resolve)
                    .catch(resolve);
            }),
            index };
    }
}

function next(jobs, result, timeout) {
    let task = getNextTasks(jobs, timeout);
    if (task !== undefined) {
        let promise = task.promise;
        let index = task.index;

        return promise.then(function (perevod) {
            result[index] = perevod;

            return next(jobs, result, timeout);
        }, function (reason) {
            result[index] = reason;

            return next(jobs, result, timeout);
        });
    }
}
