module.exports = (env, options) => {
    var isProduction = options.mode === 'production';

    const config = {
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
            libraryTarget: 'umd',
            library: 'Common'
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

    if (isProduction) {
        // 如果是生产环境，需要排除依赖包，否则外部使用的话就会重复安装（webpack打包的时候集成一次，package.json的dependencies又安装了一次）
        config.externals = {
            axios: 'axios',
            '@zibu/common-base': '@zibu/common-base'
        };
    }

    return config;
};
