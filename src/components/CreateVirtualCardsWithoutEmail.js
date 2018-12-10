import React, { Component } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { FormattedMessage } from 'react-intl';
import { Flex, Box } from '@rebass/grid';
import { get } from 'lodash';
import { graphql } from 'react-apollo';

import { getCollectiveSourcePaymentMethodsQuery } from '../graphql/queries';
import StyledInputAmount from './StyledInputAmount';
import StyledButton from './StyledButton';
import StyledInput from './StyledInput';
import StyledPaymentMethodChooser from './StyledPaymentMethodChooser';
import Loading from './Loading';
import Link from './Link';

const MIN_AMOUNT = 5;

const InlineField = ({ name, children, label }) => (
  <Flex alignItems="center" mb="2.5em">
    <Box css={{ flexBasis: '12em' }}>
      <label htmlFor={`virtualcard-${name}`}>{label}</label>
    </Box>
    {children}
  </Flex>
);

const FieldLabelDetails = styled.span`
  color: ${props => props.theme.colors.black[400]};
  font-weight: 400;
`;

class CreateVirtualCardsWithoutEmail extends Component {
  static propTypes = {
    collectiveId: PropTypes.number.isRequired,
    collectiveSlug: PropTypes.string.isRequired,
    currency: PropTypes.string.isRequired,
  };

  constructor(props) {
    super(props);
    this.form = React.createRef();
    this.onSubmit = this.onSubmit.bind(this);
    this.state = { values: { amount: '', count: 1 }, errors: { emails: [] }, submitting: false };
  }

  onChange(fieldName, value) {
    if (fieldName === 'amount') {
      const intAmount = parseInt(value);
      if (!isNaN(intAmount)) {
        this.setState(state => ({ ...state, values: { ...state.values, amount: intAmount } }));
      } else if (this.state.values.amount === undefined) {
        this.setState(state => ({ ...state, values: { ...state.values, amount: MIN_AMOUNT } }));
      }
    } else if (fieldName === 'count') {
      const intCount = parseInt(value);
      if (!isNaN(intCount)) {
        this.setState(state => ({ ...state, values: { ...state.values, count: intCount } }));
      } else if (this.state.values.count === undefined) {
        this.setState(state => ({ ...state, values: { ...state.values, count: 1 } }));
      }
    }
  }

  onSubmit(e) {
    e.preventDefault();
    if (!this.state.submitting && this.form.current.reportValidity()) {
      this.setState({ submitting: true });
      // TODO
    }
  }

  getError(fieldName) {
    return this.state.errors[fieldName];
  }

  renderSubmit() {
    const { submitting, values } = this.state;
    return (
      <StyledButton
        type="submit"
        buttonSize="large"
        buttonStyle="primary"
        minWidth="5em"
        loading={submitting}
        disabled={values.count === 0}
      >
        <FormattedMessage
          id="virtualCards.generate"
          defaultMessage="Create {count} gift cards"
          values={{ count: values.count }}
        />
      </StyledButton>
    );
  }

  renderNoPaymentMethodMessage() {
    return (
      <Flex justifyContent="center">
        <Link route="editCollectiveSection" params={{ slug: this.props.collectiveSlug, section: 'payment-methods' }}>
          <StyledButton buttonSize="large" mt="2em" justifyContent="center">
            <FormattedMessage
              id="virtualCards.create.requirePM"
              defaultMessage="You must add a payment method to your account to create gift cards"
            />
          </StyledButton>
        </Link>
      </Flex>
    );
  }

  render() {
    const loading = get(this.props, 'data.loading');
    const paymentMethods = get(this.props, 'data.Collective.paymentMethods', []);

    if (loading) return <Loading />;
    if (paymentMethods.length === 0) return this.renderNoPaymentMethodMessage();

    const { submitting, values } = this.state;

    return (
      <form ref={this.form} onSubmit={this.onSubmit}>
        <Flex flexDirection="column">
          <InlineField
            name="amount"
            label={<FormattedMessage id="virtualCards.create.amount" defaultMessage="Amount" />}
          >
            <StyledInputAmount
              id="virtualcard-amount"
              currency={this.props.currency}
              onChange={e => this.onChange('amount', e.target.value)}
              error={this.getError('amount')}
              value={values.amount}
              min={MIN_AMOUNT}
              disabled={submitting}
              required
            />
          </InlineField>

          <InlineField
            name="count"
            label={<FormattedMessage id="virtualCards.create.number" defaultMessage="Number of gift cards" />}
          >
            <StyledInput
              id="virtualcard-count"
              type="number"
              step="1"
              maxWidth="8em"
              onChange={e => this.onChange('count', e.target.value)}
              value={this.state.values.count}
              disabled={submitting}
            />
          </InlineField>

          <InlineField
            name="paymentMethod"
            label={<FormattedMessage id="virtualCards.create.paymentMethod" defaultMessage="Payment Method" />}
          >
            <StyledPaymentMethodChooser disabled={submitting} paymentMethods={paymentMethods} />
          </InlineField>

          <Box mb="1em" css={{ alignSelf: 'center' }}>
            {this.renderSubmit()}
          </Box>
        </Flex>
      </form>
    );
  }
}

const addPaymentMethods = graphql(getCollectiveSourcePaymentMethodsQuery, {
  options: props => ({ variables: { id: props.collectiveId } }),
});

export default addPaymentMethods(CreateVirtualCardsWithoutEmail);
