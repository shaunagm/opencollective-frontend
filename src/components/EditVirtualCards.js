import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { graphql } from 'react-apollo';
import { ButtonGroup } from 'react-bootstrap';
import { Flex, Box } from '@rebass/grid';
import { get, last } from 'lodash';
import { withRouter } from 'next/router';

import { Add } from 'styled-icons/material/Add.cjs';
import { PaperPlane } from 'styled-icons/fa-solid/PaperPlane.cjs';

import { getCollectiveVirtualCards } from '../graphql/queries';
import VirtualCardDetails from './VirtualCardDetails';
import Loading from './Loading';
import Pagination from './Pagination';
import Link from './Link';
import { Link as LinkWrapper } from '../server/pages';
import StyledLink from './StyledLink';

/**
 * A filterable list of virtual cards meant to be displayed for organization
 * admins.
 */
class EditVirtualCards extends React.Component {
  static propTypes = {
    collectiveId: PropTypes.number.isRequired,
    collectiveSlug: PropTypes.string.isRequired,
    /** Max number of items to display */
    limit: PropTypes.number,
    /** Provided by graphql */
    data: PropTypes.object,
    /** Provided by withRouter */
    router: PropTypes.object,
    /** Provided by addTransactionsData */
    setConfirmedFilter: PropTypes.func,
  };

  constructor(props) {
    super(props);
    this.state = { claimedFilter: 'all' };
  }

  renderFilterLink(onlyConfirmed, paymentMethods, filterName, label) {
    let btnClassName = 'btn-default';
    if (
      (filterName === 'all' && (onlyConfirmed === undefined || onlyConfirmed === 'all')) ||
      (filterName === 'claimed' && onlyConfirmed) ||
      (filterName === 'unclaimed' && onlyConfirmed === false)
    ) {
      btnClassName = 'btn-primary';
    } else if (onlyConfirmed === undefined && (!paymentMethods || paymentMethods.length === 0)) {
      btnClassName += ' disabled';
    }

    return (
      <Link
        route="editCollective"
        className={`filterBtn btn ${btnClassName}`}
        params={{ ...this.props.router.query, filter: filterName, offset: 0 }}
      >
        {label}
      </Link>
    );
  }

  renderFilters(onlyConfirmed, paymentMethods) {
    return (
      <div className="filter">
        <ButtonGroup>
          {this.renderFilterLink(
            onlyConfirmed,
            paymentMethods,
            'all',
            <FormattedMessage id="virtualCards.filterAll" defaultMessage="All" />,
          )}
          {this.renderFilterLink(
            onlyConfirmed,
            paymentMethods,
            'claimed',
            <FormattedMessage id="virtualCards.filterClaimed" defaultMessage="Claimed" />,
          )}
          {this.renderFilterLink(
            onlyConfirmed,
            paymentMethods,
            'unclaimed',
            <FormattedMessage id="virtualCards.filterUnclaimed" defaultMessage="Unclaimed" />,
          )}
        </ButtonGroup>
      </div>
    );
  }

  renderNoVirtualCardMessage(onlyConfirmed) {
    if (onlyConfirmed === undefined) {
      return (
        <Link route="editCollectiveSection" params={{ slug: this.props.collectiveSlug, section: 'gift-cards-create' }}>
          <FormattedMessage id="virtualCards.createFirst" defaultMessage="Create your first gift card!" />
        </Link>
      );
    } else if (onlyConfirmed) {
      return <FormattedMessage id="virtualCards.emptyClaimed" defaultMessage="No gift card claimed yet" />;
    } else {
      return <FormattedMessage id="virtualCards.emptyUnclaimed" defaultMessage="No unclaimed gift card" />;
    }
  }

  render() {
    const { loading } = this.props.data;
    const queryResult = get(this.props, 'data.Collective.createdVirtualCards', {});
    const onlyConfirmed = get(this.props, 'data.variables.isConfirmed');
    const { offset, limit, total, paymentMethods } = queryResult;
    const lastVirtualCard = last(paymentMethods);

    return (
      <div>
        <Flex mb={4} justifyContent="space-between">
          {this.renderFilters(onlyConfirmed, paymentMethods)}
          <Flex>
            <LinkWrapper
              route="editCollectiveSection"
              params={{ slug: this.props.collectiveSlug, section: 'gift-cards-create' }}
              passHref
            >
              <StyledLink buttonStyle="standard" buttonSize="medium">
                <Add size="1em" />
                {'  '}
                <FormattedMessage id="virtualCards.createSingle" defaultMessage="Create gift cards" />
              </StyledLink>
            </LinkWrapper>
            <Box mr="0.5em" />
            <LinkWrapper
              route="editCollectiveSection"
              params={{ slug: this.props.collectiveSlug, section: 'gift-cards-send' }}
              passHref
            >
              <StyledLink buttonStyle="primary" buttonSize="medium">
                <PaperPlane size="1em" />
                {'  '}
                <FormattedMessage id="virtualCards.send" defaultMessage="Send gift cards" />
              </StyledLink>
            </LinkWrapper>
          </Flex>
        </Flex>
        {loading ? (
          <Loading />
        ) : (
          <div>
            {paymentMethods.length === 0 && (
              <Flex justifyContent="center" mt="4em">
                {this.renderNoVirtualCardMessage(onlyConfirmed)}
              </Flex>
            )}
            {paymentMethods.map(v => (
              <div key={v.id}>
                <VirtualCardDetails virtualCard={v} />
                {v !== lastVirtualCard && <hr />}
              </div>
            ))}
            {total > limit && (
              <Flex justifyContent="center" mt={4}>
                <Pagination offset={offset} total={total} limit={limit} />
              </Flex>
            )}
          </div>
        )}
      </div>
    );
  }
}

const VIRTUALCARDS_PER_PAGE = 15;

const getIsConfirmedFromFilter = filter => {
  if (filter === undefined || filter === 'all') {
    return undefined;
  }
  return filter === 'claimed';
};

const getGraphQLVariablesFromProps = props => ({
  CollectiveId: props.collectiveId,
  isConfirmed: getIsConfirmedFromFilter(props.router.query.filter),
  offset: props.router.query.offset || 0,
  limit: props.limit || VIRTUALCARDS_PER_PAGE,
});

export const addTransactionsData = graphql(getCollectiveVirtualCards, {
  options: props => ({ variables: getGraphQLVariablesFromProps(props) }),
  props: ({ data }) => ({
    data,
    setConfirmedFilter: isConfirmed => data.refetch({ ...data.variables, isConfirmed: isConfirmed }),
  }),
});

export default withRouter(addTransactionsData(EditVirtualCards));
