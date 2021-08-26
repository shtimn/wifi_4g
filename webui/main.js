window.kthy_web_ui_is_test = false;
/**
 * 设定公用模块别名
 * @config require.config
 */
require.config({
    paths: {
        text: 'lib/require/text',
        tmpl: '../tmpl',
        underscore: 'lib/underscore/underscore',
        knockout: 'lib/knockout/knockout',
    	jquery: 'lib/require/require-jquery',
        jq_validate: 'lib/jquery/jquery.validate',
        jq_additional: 'lib/jquery/additional-methods',
        jq_i18n: 'lib/jquery/jquery.i18n.properties-1.0.9',
        jq_translate: 'lib/jquery/translate',
        jq_tmpl: 'lib/jquery/jquery.tmpl.min',
        knockoutbase: 'lib/knockout/knockout-2.1.0',
        jq_simplemodal: 'lib/jquery/jquery.simplemodal-1.4.2',
        jq_slideshow: 'lib/jquery/jquery.slideshow.lite',
        base64: 'lib/base64'
    },

    shim: {
        jq_additional: ['jq_validate'],
        jq_translate: ['jq_i18n'],
        knockoutbase: ['jq_tmpl']

    }
});

//preload device config
require(['config/config'], function(config) {
    var devicePath = 'config/' + config.DEVICE;
    require([devicePath + '/menu', devicePath + '/config'], function (deviceMenu) {
        /**
         * 加载app模块及依赖顺序的第三方js
         * @module main
         */
        require([
            'app',
            kthy_web_ui_is_test ? 'simulate' : '',
            'jq_additional',
            'jq_translate',
            'jq_simplemodal',
            'jq_slideshow',
            'util',
            'base64'
        ], function (app, simulate) {
            if (kthy_web_ui_is_test) {
                window.simulate = simulate;
            }
            app.init();
        });
    });
});