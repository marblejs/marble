import * as merge from 'webpack-merge';
import { getConfig } from '../../webpack.config';

export default merge(getConfig(__dirname));
