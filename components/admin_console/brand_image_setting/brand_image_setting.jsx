// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import $ from 'jquery';
import PropTypes from 'prop-types';
import React from 'react';
import {FormattedHTMLMessage, FormattedMessage} from 'react-intl';
import {Client4} from 'mattermost-redux/client';

import {uploadBrandImage, deleteBrandImage} from 'actions/admin_actions.jsx';
import {UploadStatuses} from 'utils/constants.jsx';
import FormError from 'components/form_error.jsx';

import UploadButton from './upload_button.jsx';

const HTTP_STATUS_OK = 200;

export default class BrandImageSetting extends React.PureComponent {
    static propTypes = {

        /*
         * Set to disable the setting
         */
        disabled: PropTypes.bool.isRequired,
    }

    constructor(props) {
        super(props);

        this.handleImageSubmit = this.handleImageSubmit.bind(this);
        this.handleClearImage = this.handleClearImage.bind(this);

        this.state = {
            brandImage: null,
            brandImageExists: false,
            brandImageTimestamp: Date.now(),
            error: '',
            status: UploadStatuses.DEFAULT,
        };
    }

    UNSAFE_componentWillMount() { // eslint-disable-line camelcase
        fetch(Client4.getBrandImageUrl(this.state.brandImageTimestamp)).then(
            (resp) => {
                if (resp.status === HTTP_STATUS_OK) {
                    this.setState({brandImageExists: true});
                } else {
                    this.setState({brandImageExists: false});
                }
            }
        );
    }

    componentDidUpdate() {
        if (!this.refs.image) {
            return;
        }

        const img = this.refs.image;

        if (!this.state.brandImageExists) {
            $(img).attr('src', null);
            return;
        }

        if (!this.state.brandImage) {
            return;
        }

        const reader = new FileReader();

        reader.onload = (e) => {
            $(img).attr('src', e.target.result);
        };

        reader.readAsDataURL(this.state.brandImage);
    }

    handleClearImage(e) {
        e.preventDefault();

        if (this.state.status === UploadStatuses.LOADING) {
            return;
        }

        //this.props.onChange(this.props.id, '');
        deleteBrandImage(
          () => {
              this.setState({
                  brandImage: null,
                  brandImageExists: false,
                  status: UploadStatuses.DEFAULT,
              });
          },
          (err) => {
              this.setState({
                  error: err.message,
                  status: UploadStatuses.DEFAULT,
              });
          }
        );
    }

    handleImageSubmit(e) {
        e.preventDefault();

        if (this.state.status === UploadStatuses.LOADING) {
            return;
        }

        const element = $(this.refs.fileInput);

        if (element.prop('files').length === 0) {
            return;
        }

        this.setState({
            brandImage: element.prop('files')[0],
            status: UploadStatuses.LOADING,
        }, () => {
            uploadBrandImage(
                this.state.brandImage,
                () => {
                    this.setState({
                        brandImageExists: true,
                        brandImage: null,
                        brandImageTimestamp: Date.now(),
                        status: UploadStatuses.COMPLETE,
                    });
                },
                (err) => {
                    this.setState({
                        error: err.message,
                        status: UploadStatuses.DEFAULT,
                    });
                }
            );
        });

    }

    render() {
        let btnPrimaryClass = 'btn';
        if (this.state.brandImage) {
            btnPrimaryClass += ' btn-primary';
        }

        let letbtnDefaultClass = 'btn';
        if (!this.props.disabled) {
            letbtnDefaultClass += ' btn-default';
        }

        const clearBrandImageBtn = (
            <button type="button"
                    className="close"
                    onClick={this.handleClearImage}>
                <span aria-hidden="true">×</span>
                <span className="sr-only">Clear brand image</span>
            </button>
        );

        let img = null;
        if (this.state.brandImage) {
            img = (
                <div>
                    {clearBrandImageBtn}
                    <img
                        ref='image'
                        className='brand-img'
                        src=''
                    />
                </div>
            );
        } else if (this.state.brandImageExists) {
            img = (
                <div>
                    {clearBrandImageBtn}
                    <img
                        ref='image'
                        className='brand-img'
                        src={Client4.getBrandImageUrl(this.state.brandImageTimestamp)}
                    />
                </div>
            );
        } else {
            img = (
                <p>
                    <FormattedMessage
                        id='admin.team.noBrandImage'
                        defaultMessage='No brand image uploaded'
                    />
                </p>
            );
        }

        return (
            <div className='form-group'>
                <label className='control-label col-sm-4'>
                    <FormattedMessage
                        id='admin.team.brandImageTitle'
                        defaultMessage='Custom Brand Image:'
                    />
                </label>
                <div className='col-sm-8'>
                    {img}
                </div>
                <div className='col-sm-4'/>
                <div className='col-sm-8'>
                    <div className='file__upload'>
                        <button
                            className={letbtnDefaultClass}
                            disabled={this.props.disabled}
                        >
                            <FormattedMessage
                                id='admin.team.chooseImage'
                                defaultMessage='Choose New Image'
                            />
                        </button>
                        <input
                            ref='fileInput'
                            type='file'
                            accept='.jpg,.png,.bmp'
                            disabled={this.props.disabled}
                            onChange={this.handleImageSubmit}
                        />
                    </div>
                    <br/>
                    <FormError error={this.state.error}/>
                    <p className='help-text no-margin'>
                        <FormattedHTMLMessage
                            id='admin.team.uploadDesc'
                            defaultMessage='Customize your user experience by adding a custom image to your login screen. See examples at <a href="http://docs.mattermost.com/administration/config-settings.html#custom-branding" target="_blank">docs.mattermost.com/administration/config-settings.html#custom-branding</a>.'
                        />
                    </p>
                </div>
            </div>
        );
    }
}
