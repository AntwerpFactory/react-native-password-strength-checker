/**
 * Created by dungtran on 8/20/17.
 */

import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {
    View,
    TextInput,
    StyleSheet,
    Dimensions,
    Text,
    Animated,
    ViewPropTypes,
} from 'react-native';
import zxcvbn from 'zxcvbn';
import _ from 'lodash';

const {width: wWidth} = Dimensions.get('window');

const widthByPercent = (percentage, containerWidth = wWidth) => {
    const value = (percentage * containerWidth) / 100;
    return Math.round(value);
};

const regex = {
    digitsPattern: /\d/,
    lettersPattern: /[a-zA-Z]/,
    lowerCasePattern: /[a-z]/,
    upperCasePattern: /[A-Z]/,
    wordsPattern: /\w/,
    symbolsPattern: /\W/,
};

export default class PasswordStrengthChecker extends Component {
    static defaultProps = {
        minLevel: 2,
        minLength: 0,
        ruleNames: 'lowerCase|upperCase|digits|symbols',
        strengthLevels: [
            {
                label: 'Weak',
                labelColor: '#fff',
                widthPercent: 33,
                innerBarColor: '#fe6c6c',
            },
            {
                label: 'Weak',
                labelColor: '#fff',
                widthPercent: 33,
                innerBarColor: '#fe6c6c',
            },
            {
                label: 'Fair',
                labelColor: '#fff',
                widthPercent: 67,
                innerBarColor: '#feb466',
            },
            {
                label: 'Fair',
                labelColor: '#fff',
                widthPercent: 67,
                innerBarColor: '#feb466',
            },
            {
                label: 'Strong',
                labelColor: '#fff',
                widthPercent: 100,
                innerBarColor: '#6cfeb5',
            },
        ],
        tooShort: {
            enabled: false,
            labelColor: '#fff',
            label: 'Too short',
            widthPercent: 33,
            innerBarColor: '#fe6c6c',
        },
        barColor: '#ffffff',
        barWidthPercent: 70,
        showBarOnEmpty: true,
    };

    static propTypes = {
        onChangeText: PropTypes.func.isRequired,
        minLength: PropTypes.number,
        ruleNames: PropTypes.string,
        strengthLevels: PropTypes.array,
        tooShort: PropTypes.object,
        minLevel: PropTypes.number,
        inputWrapperStyle: ViewPropTypes.style,
        inputStyle: TextInput.propTypes.style,
        strengthWrapperStyle: ViewPropTypes.style,
        strengthBarStyle: ViewPropTypes.style,
        innerStrengthBarStyle: ViewPropTypes.style,
        strengthDescriptionStyle: Text.propTypes.style,
        barColor: PropTypes.string,
        barWidthPercent: PropTypes.number,
        showBarOnEmpty: PropTypes.bool,
        selectionColor: PropTypes.string,
        wrapperStyle: ViewPropTypes.style,
        label: PropTypes.string,
        labelStyle: Text.propTypes.style,
        labelWrapperStyle: ViewPropTypes.style,
    };

    constructor(props) {
        super(props);
        this.animatedInnerBar1Width = new Animated.Value(0);
        this.animatedInnerBar2Width = new Animated.Value(0);
        this.animatedInnerBar3Width = new Animated.Value(0);
        this.animatedInnerBar4Width = new Animated.Value(0);
        this.animatedBarWidth = new Animated.Value(0);
        this.state = {
            level: -1,
            isTooShort: false,
        };
    }

    componentDidMount() {
        const {showBarOnEmpty} = this.props;
        if (showBarOnEmpty) {
            this.showFullBar();
        }
    }

    showFullBar(isShow = true) {
        const {barWidthPercent} = this.props;
        const barWidth = isShow ? widthByPercent(barWidthPercent) : 0;
        Animated.timing(this.animatedBarWidth, {
            toValue: barWidth,
            duration: 20,
        }).start();
    }

    isTooShort(password) {
        const {minLength} = this.props;
        if (!minLength) {
            return true;
        }
        return password.length < minLength;
    }

    isMatchingRules(password) {
        const {ruleNames} = this.props;
        if (!ruleNames) {
            return true;
        }

        const rules = _
            .chain(ruleNames)
            .split('|')
            .filter(rule => !!rule)
            .map(rule => rule.trim())
            .value();

        for (const rule of rules) {
            if (!this.isMatchingRule(password, rule)) {
                return false;
            }
        }
        return true;
    }

    isMatchingRule(password, rule) {
        switch (rule) {
            case 'symbols':
                return regex.symbolsPattern.test(password);
            case 'words':
                return regex.wordsPattern.test(password);
            case 'digits':
                return regex.digitsPattern.test(password);
            case 'letters':
                return regex.lettersPattern.test(password);
            case 'lowerCase':
                return regex.lowerCasePattern.test(password);
            case 'upperCase':
                return regex.upperCasePattern.test(password);
            default:
                return true;
        }
    }

    calculateScore(text) {
        if (!text) {
            this.setState({
                isTooShort: false,
            });
            return -1;
        }

        if (this.isTooShort(text)) {
            this.setState({
                isTooShort: true,
            });
            return 0;
        }

        this.setState({
            isTooShort: false,
        });

        if (!this.isMatchingRules(text)) {
            return 0;
        }

        return zxcvbn(text).score;
    }

    getPasswordStrengthLevel(password) {
        return this.calculateScore(password);
    }

    onChangeText(password) {
        const level = this.getPasswordStrengthLevel(password);
        this.setState({
            level: level,
        });
        const isValid =
            this.isMatchingRules(password) && level >= this.props.minLevel;
        this.props.onChangeText(password, isValid);
    }

    widthBetween(value, min, max, minValue, maxValue) {
        if (value > min) {
            return maxValue
        }

        return minValue;
    }

    renderPasswordInput() {
        const {inputWrapperStyle, inputStyle, selectionColor} = this.props;
        return (
            <View style={[styles.inputWrapper, inputWrapperStyle]}>
                <TextInput
                    selectionColor={selectionColor}
                    autoCapitalize="none"
                    autoCorrect={false}
                    multiline={false}
                    underlineColorAndroid="transparent"
                    {...this.props}
                    style={[styles.input, inputStyle]}
                    onChangeText={text => this.onChangeText(text)}
                />
            </View>
        );
    }

    renderPasswordStrength() {
        const {
            barWidthPercent,
            tooShort,
            strengthLevels,
            barColor,
            strengthWrapperStyle,
            strengthBarStyle,
            innerStrengthBarStyle,
            strengthDescriptionStyle,
            showBarOnEmpty,
        } = this.props;

        const barWidth = widthByPercent(barWidthPercent);

        const {level} = this.state;

        let strengthLevelBarStyle = {},
            strengthLevelLabelStyle = {},
            strengthLevelLabel = '',
            innerBar1Width = 0;
        innerBar2Width = 0;
        innerBar3Width = 0;
        innerBar4Width = 0;
        if (level !== -1) {
            if (!showBarOnEmpty) {
                this.showFullBar();
            }

            const Bar1Width = strengthLevels[level].widthPercent >= 25 ? 100 : 0
            const Bar2Width = strengthLevels[level].widthPercent > 25 ? 100 : 0
            const Bar3Width = strengthLevels[level].widthPercent > 50 ? 100 : 0
            const Bar4Width = strengthLevels[level].widthPercent > 75 ? 100 : 0

            innerBar1Width = widthByPercent(
                Bar1Width,
                barWidth,
            );
            innerBar2Width = widthByPercent(
                Bar2Width,
                barWidth,
            );
            innerBar3Width = widthByPercent(
                Bar3Width,
                barWidth,
            );
            innerBar4Width = widthByPercent(
                Bar4Width,
                barWidth,
            );
            strengthLevelBarStyle = {
                backgroundColor: strengthLevels[level].innerBarColor,
            };

            strengthLevelLabelStyle = {
                color: strengthLevels[level].labelColor,
            };
            strengthLevelLabel = strengthLevels[level].label;

            if (tooShort.enabled && this.state.isTooShort) {
                innerBar1Width =
                    widthByPercent(tooShort.widthPercent, barWidth) ||
                    widthByPercent(strengthLevels[level].widthPercent, barWidth);
                strengthLevelBarStyle = {
                    backgroundColor:
                        tooShort.innerBarColor || strengthLevels[level].innerBarColor,
                };
                strengthLevelLabelStyle = {
                    color: tooShort.labelColor || strengthLevels[level].labelColor,
                };
                strengthLevelLabel = tooShort.label || strengthLevels[level].label;
            }
        } else {
            if (!showBarOnEmpty) {
                this.showFullBar(false);
            }
        }

        Animated.timing(this.animatedInnerBar1Width, {
            toValue: innerBar1Width,
            duration: 800,
        }).start();

        Animated.timing(this.animatedInnerBar2Width, {
            toValue: innerBar2Width,
            duration: 800,
        }).start();

        Animated.timing(this.animatedInnerBar3Width, {
            toValue: innerBar3Width,
            duration: 800,
        }).start();

        Animated.timing(this.animatedInnerBar4Width, {
            toValue: innerBar4Width,
            duration: 800,
        }).start();

        return (
            <View style={[styles.passwordStrengthWrapper, strengthWrapperStyle]}>
                <View style={{flexDirection: 'row'}}>
                    <Animated.View
                        style={[
                            styles.passwordStrengthBar,
                            strengthBarStyle,
                            {backgroundColor: barColor, width: '20%'},
                        ]}
                    >
                        <Animated.View
                            style={[
                                styles.innerPasswordStrengthBar,
                                innerStrengthBarStyle,
                                {
                                    ...strengthLevelBarStyle,
                                    maxWidth: '100%',
                                    width: this.animatedInnerBar1Width
                                },
                            ]}
                        />
                    </Animated.View>
                    <Animated.View
                        style={[
                            styles.passwordStrengthBar,
                            strengthBarStyle,
                            {backgroundColor: barColor, width: '20%'},
                        ]}
                    >
                        <Animated.View
                            style={[
                                styles.innerPasswordStrengthBar,
                                innerStrengthBarStyle,
                                {
                                    ...strengthLevelBarStyle,
                                    maxWidth: '100%',
                                    width: this.animatedInnerBar2Width
                                },
                            ]}
                        />
                    </Animated.View>
                    <Animated.View
                        style={[
                            styles.passwordStrengthBar,
                            strengthBarStyle,
                            {backgroundColor: barColor, width: '20%'},
                        ]}
                    >
                        <Animated.View
                            style={[
                                styles.innerPasswordStrengthBar,
                                innerStrengthBarStyle,
                                {
                                    ...strengthLevelBarStyle,
                                    maxWidth: '100%',
                                    width: this.animatedInnerBar3Width
                                },
                            ]}
                        />
                    </Animated.View>
                    <Animated.View
                        style={[
                            styles.passwordStrengthBar,
                            strengthBarStyle,
                            {backgroundColor: barColor, width: '20%'},
                        ]}
                    >
                        <Animated.View
                            style={[
                                styles.innerPasswordStrengthBar,
                                innerStrengthBarStyle,
                                {
                                    ...strengthLevelBarStyle,
                                    maxWidth: '100%',
                                    width: this.animatedInnerBar4Width
                                },
                            ]}
                        />
                    </Animated.View>
                </View>
                <Text
                    style={[
                        styles.strengthDescription,
                        strengthDescriptionStyle,
                        {...strengthLevelLabelStyle},
                    ]}
                >
                    {strengthLevelLabel}
                </Text>
            </View>
        );
    }

    render() {
        const {wrapperStyle, label, labelWrapperStyle, labelStyle} = this.props;

        return (
            <View style={[styles.wrapper, wrapperStyle]}>
                <View style={labelWrapperStyle}>
                    {label &&
                    <Text style={labelStyle}>{label}</Text>
                    }
                    {this.renderPasswordInput()}
                </View>
                {this.renderPasswordStrength()}
            </View>
        );
    }
}

const styles = StyleSheet.create({
    wrapper: {
        backgroundColor: 'transparent',
    },
    inputWrapper: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
        borderBottomWidth: 0.8,
        borderColor: 'rgba(242, 242, 242, 0.5)',
    },
    input: {
        flex: 1,
        color: '#fff',
        paddingTop: 7,
        paddingBottom: 10,
        fontSize: 20,
    },
    passwordStrengthWrapper: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 10,
    },
    passwordStrengthBar: {
        height: 10,
        position: 'relative',
        top: 5,
        bottom: 5,
        borderRadius: 5,
    },
    innerPasswordStrengthBar: {
        height: 10,
        borderRadius: 5,
        width: 0,
    },
    strengthDescription: {
        color: '#fff',
        backgroundColor: 'transparent',
        textAlign: 'right',
        position: 'absolute',
        right: 5,
        top: 1,
        fontSize: 14,
    },
});
