import React, { Component } from 'react';
import Helmet from 'react-helmet';
import { graphql } from 'gatsby';

import Button from 'react-bootstrap/Button';
import ListGroup from 'react-bootstrap/ListGroup';

import uuid from 'react-uuid';

import { Layout, Link } from '@components';
import { StyledHeading, StyledMainWrapper } from '../../src/components/styles/Docs';

const jsonSchema = {
  title: 'incident',
  properties: {
    _id: {
      bsonType: 'objectId',
    },
    authors: {
      bsonType: 'array',
      items: {
        bsonType: 'string',
      },
    },
    date_downloaded: {
      bsonType: 'string',
    },
    date_modified: {
      bsonType: 'string',
    },
    date_published: {
      bsonType: 'string',
    },
    date_submitted: {
      bsonType: 'string',
    },
    description: {
      bsonType: 'string',
    },
    flag: {
      bsonType: 'bool',
    },
    image_url: {
      bsonType: 'string',
    },
    incident_date: {
      bsonType: 'string',
    },
    incident_id: {
      bsonType: 'int',
    },
    language: {
      bsonType: 'string',
    },
    ref_number: {
      bsonType: 'int',
    },
    report_number: {
      bsonType: 'int',
    },
    source_domain: {
      bsonType: 'string',
    },
    submitters: {
      bsonType: 'array',
      items: {
        bsonType: 'string',
      },
    },
    text: {
      bsonType: 'string',
    },
    title: {
      bsonType: 'string',
    },
    url: {
      bsonType: 'string',
    },
  },
};

const ValidateReport = ({ node }) => {
  let ret = [];

  const discoverURL = '/discover/index.html?incident_id=' + node['incident_id'];

  Object.keys(jsonSchema['properties']).forEach(key => {
    if (!Object.keys(node).includes(key)) {
      ret.push(
        <ListGroup.Item key={uuid()} variant="danger">
          <a href={discoverURL}>
            {key + ' (not in schema): '}
            {node[key]}
          </a>
        </ListGroup.Item>
      );
    } else if (
      jsonSchema['properties'][key]['bsonType'] == 'string' &&
      typeof node[key] !== 'string'
    ) {
      ret.push(
        <ListGroup.Item key={uuid()} variant="dark">
          <a href={discoverURL}>
            {key + ' (is not string): '}
            {node[key]}
          </a>
        </ListGroup.Item>
      );
    } else if (
      jsonSchema['properties'][key]['bsonType'] == 'int' &&
      typeof node[key] !== 'number'
    ) {
      ret.push(
        <ListGroup.Item key={uuid()} variant="danger">
          <a href={discoverURL}>
            {key + ' (is not number): '}
            {node[key]}
          </a>
        </ListGroup.Item>
      );
    } else if (
      jsonSchema['properties'][key]['bsonType'] == 'array' &&
      (typeof node[key] !== 'object' || node[key].length < 1)
    ) {
      ret.push(
        <ListGroup.Item key={uuid()} variant="danger">
          <a href={discoverURL}>
            {key + ' (is empty or not array): '}
            {node[key]}
          </a>
        </ListGroup.Item>
      );
    }
  });
  return <>{ret}</>;
};

const ReportList = ({ items }) => {
  const minPublishDate = items.reduce(
    (accumulator, currentValue) =>
      accumulator > Date.parse(currentValue['node']['date_published'])
        ? accumulator
        : Date.parse(currentValue['node']['date_published']),
    9999999999999999
  );

  const incidentDate = Date.parse(items[0]['node']['incident_date']);

  let dateIssue = '';

  if (minPublishDate < incidentDate) {
    dateIssue = (
      <ListGroup.Item key={uuid()} variant="danger">
        Publication dates precede the incident date
      </ListGroup.Item>
    );
  }
  const hasIncidentDateIssue = items.reduce(
    (accumulator, currentValue) =>
      items[0]['node']['incident_date'] === currentValue['node']['incident_date']
        ? accumulator
        : true,
    false
  );

  let incidentDateIssue = '';

  if (hasIncidentDateIssue) {
    incidentDateIssue = (
      <ListGroup.Item key={uuid()} variant="danger">
        Incident Dates are not consistent
      </ListGroup.Item>
    );
  }
  return (
    <ListGroup>
      {dateIssue}
      {incidentDateIssue}
      {items.map(value => (
        <ValidateReport key={uuid()} node={value['node']} />
      ))}
    </ListGroup>
  );
};

const IncidentList = ({ group }) => {
  return (
    <>
      {group.map(value => (
        <div key={uuid()}>
          <h2>
            Incident {value['edges'][0]['node']['incident_id']}{' '}
            <Button
              variant="outline-primary"
              href={'/discover/index.html?incident_id=' + value['edges'][0]['node']['incident_id']}
            >
              Discover
            </Button>
          </h2>
          <ReportList key={uuid()} items={value['edges']} />
        </div>
      ))}
    </>
  );
};

export default class ValidateDB extends Component {
  render() {
    const { data } = this.props;

    if (!data) {
      return null;
    }
    const {
      allMongodbAiidprodIncidents: { group },
    } = data;

    // sort by value
    group.sort(function(a, b) {
      return a['edges'][0]['node']['incident_id'] - b['edges'][0]['node']['incident_id'];
    });

    return (
      <Layout {...this.props}>
        <Helmet>
          <title>Incident List</title>
        </Helmet>
        <div className={'titleWrapper'}>
          <StyledHeading>Incident List</StyledHeading>
        </div>
        <StyledMainWrapper>
          <p className="paragraph">
            This is a simple numeric listing of all incidents and their reports within the database.
            If you would like to explore the contents of the reports, you should work through the
            <Link to="/apps/1-discover"> Discover app</Link>.
          </p>
          <IncidentList group={group} />
        </StyledMainWrapper>
      </Layout>
    );
  }
}

export const pageQuery = graphql`
  query ValidationsQuery {
    allMongodbAiidprodIncidents(
      filter: { flag: { eq: null } }
      sort: { order: ASC, fields: incident_id }
    ) {
      group(field: incident_id) {
        edges {
          node {
            authors
            source_domain
            submitters
            url
            title
            text
            report_number
            ref_number
            language
            incident_id
            incident_date
            image_url
            flag
            description
            date_submitted
            date_published
            date_modified
            date_downloaded
          }
        }
      }
    }
  }
`;
