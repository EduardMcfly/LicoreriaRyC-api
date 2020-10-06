import gql from 'graphql-tag';

export default gql`
  extend type Query {
    products: [Product!]!
    product(id: ID!): Product!
  }

  type Product {
    id: ID!
    name: String!
    price: Int!
    image: String
    description: String
  }
`;
