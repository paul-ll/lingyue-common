var isProduction = process.env.BABEL_ENV === 'production';

module.exports = {
    mode: isProduction ? 'production' : 'development',
    entry: {
        index: './src/index.js',
        AjaxService: './src/AjaxService.js',
        clipboard: './src/clipboard.js',
        queryString: './src/queryString.js'
    },
    output: {
        path: __dirname + '/dist',
        filename: '[name].js',
        globalObject: "typeof window !== 'undefined' ? window : this",
        libraryTarget: 'umd'
    },
    externals: {
        axios: 'axios',
        'lvl-common-base': 'lvl-common-base'
    },
    devtool: isProduction ? '#source-map' : '#cheap-module-source-map',
    module: {
        rules: [
            {
                enforce: 'pre',
                test: /\.js$/,
                exclude: /(node_modules|dist)/,
                loader: 'eslint-loader',
                options: {
                    failOnError: true
                }
            },
            {
                test: /\.js$/,
                exclude: /(node_modules|dist)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            [
                                '@babel/preset-env',
                                {
                                    modules: false,
                                    targets: {
                                        browsers: ['last 15 versions', 'safari >= 4', 'not ie < 9', 'iOS >= 7']
                                    }
                                }
                            ]
                        ]
                    }
                }
            }
        ]
    },
    plugins: []
};
