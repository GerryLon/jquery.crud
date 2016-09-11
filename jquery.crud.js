/**
 * 经常使用$.ajax来发送请求, 如果success中业务太复杂, 不方便管理, 
 * 而且如果success中还要使用$.ajax就不好控制了
 * 
 * @author wanjl
 * @date 2016/09/11
 */
;
(function(window, $, undefined) {

    var defaultOptions = null,
        beforeLast;

    $.extend({
        crud: function(url, options) {

            var deferreds = [],
                done, allDone, fail, errHandler, progress, complete, always;

            done = allDone = failed = progress = complete = always = $.noop;

            var type = $.type(url);

            // $.ajax({
            // url: index.php
            // });

            // 四种传递参数的方式
            // [url, options], [options], ($.ajax(), $.ajax()), [$.ajax(), $.ajax()]

            // (options)
            if (type === 'object' && !$.isFunction(url.promise)) {
                options = undefined;
                url = options.url;
            }

            // (url, options)
            if (typeof url === 'string') {

                defaultOptions = {
                    url: url,
                    type: 'GET',
                    dataType: 'json',
                    success: done,
                    error: fail,
                    complete: complete,

                    /**
                     * 可能会有这样的需求, 在某些条件满足的情况下发送请求 其他情况禁止发送请求 比如当资源的id大于100时
                     * 返回false不发送, 返回true发送请求
                     * 
                     * @return {[type]} [description]
                     */
                    requestFilter: function(url, options) {
                        var dfd = $.Deferred();

                        // maybe you can do this to prevent useless request
                        // $.ajax(url, options).done(function(data) {
                        //     dfd.resolve(data);
                        // });

                        // if (url && options.dataType === 'abc') {
                        //     dfd.reject();
                        // }

                        dfd.resolve(); // return true
                        // dfd.reject(); // return false

                        return dfd.promise();
                    }
                };

                options = $.extend(true, {}, defaultOptions, options);

                var requestFilter = options.requestFilter,
                    promise = requestFilter.call($, url, options);

                promise.done(function() {
                    return $.ajax(options);
                }).fail(function() {
                    // 不满足执行请求的条件
                });
            } else {
                // ($.ajax(), $.ajax()), [$.ajax(), $.ajax()]
                defaultOptions = {
                    progress: progress,
                    allDone: done,
                    oneFailed: failed,
                    always: always,
                    errHandler: function(response) {
                        $.error(response);
                    }
                };

                var args = [],
                    arg = arguments[0];

                // $.crud($.ajax(), $.ajax(). options)
                if ($.type(arguments[0]) === 'object') {
                    args = $.makeArray(arguments);

                    beforeLast = args.slice(0,
                        args.length - 1);
                    options = args.slice(-1)[0];
                }

                // $.crud([$.ajax(), $.ajax()], options)
                else if ($.type(arguments[0]) === 'array') {
                    beforeLast = arguments[0];
                    options = arguments[1];
                }

                // 每个应该都是promise
                if (beforeLast.every(function(arg) {
                        return $.isFunction(arg.promise);
                    })) {

                    deferreds = $.makeArray(beforeLast);
                    options = $.extend(true, {}, defaultOptions, options);
                }

                return whenWithProgress(deferreds, function(cnt, deferredsLen) {
                        options.progress();
                    })
                    .done(function( /* response1, , ..., responseN */ ) {

                        var responses = genDataArr(arguments);

                        // 这里是业务上的, 本来不想关联业务, 后来想了想还是写上吧
                        if (responses.every(function(response) {
                                // arg = [response, textStatus, jqXHR]
                                // we always ignore the two params, so do so
                                return response.ret === 0;
                            })) {

                            // all succeed
                            allDone = options.allDone;

                            // 所有成功, 只有一个处理函数
                            if ($.isFunction(allDone)) {
                                allDone.apply(null, responses);

                                // 函数数组
                            } else if ($.type(allDone) === 'array') {

                                // 返回信息和处理函数一一对应, 如果不写给空
                                responses.map(function(response, i) {
                                    return [response, allDone[i] || function() {}];
                                }).forEach(function(pair) {
                                    pair[1].call(null, pair[0]);
                                });
                            }
                        } else {
                            // 至少有一个失败, 注意这里说的时返回的ret不为0就称为失败
                            // 如果要执行多个ajax, 但是有一个失败(ret不为0),
                            // 可以只指定一个错误处理函数,也可以一一指定
                            errHandler = options.errHandler;

                            if ($.isFunction(errHandler)) {
                                errHandler.apply(null, errHandler);

                                // 函数数组
                            } else if ($.type(errHandler) === 'array') {

                                // 返回信息和处理函数一一对应, 如果不写给空
                                responses.map(function(response, i) {
                                    return [response, errHandler[i] || function() {}];
                                }).forEach(function(pair) {
                                    pair[1].call(null, pair[0]);
                                });
                            }
                        }
                    }).fail(function() {
                        options.oneFailed();
                    }).always(function() {
                        options.always();
                    });
            }
        }
    });

    // args = [[data, textStatus, jqXHR], [data, textStatus, jqXHR]]
    function genDataArr(args) {
        return Array.prototype.slice.call(args).map(function(arg) {
            return arg[0];
        });
    }

    // $.whenWithProgress(requests, function(cnt, total) {
    //     console.log("promise " + cnt + " of " + total + " finished");
    // }).then(function() {
    //     // done handler here
    // }, function() {
    //     // err handler here
    // });

    function whenWithProgress(arrayOfPromises, progressCallback) {
        var cnt = 0,
            i = 0,
            len = 0;
        for (len = arrayOfPromises.length; i < len; i++) {
            arrayOfPromises[i].done(function() {
                progressCallback(++cnt, len);
            });
        }
        return $.when.apply($, arrayOfPromises);
    }

}(window, jQuery));
