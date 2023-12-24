import React from 'react';
import { graphql, useStaticQuery } from 'gatsby';
import { GatsbyImage, getImage } from 'gatsby-plugin-image';
import { Table } from 'react-bootstrap'; // 確保加入這行

const CourseList = () => {

    const data = useStaticQuery(graphql`
    query {
      allFile(filter: {extension: {regex: "/(jpg|jpeg|png)/"}, sourceInstanceName: {eq: "images"}}) {
        edges {
          node {
            childImageSharp {
              gatsbyImageData(width: 30, layout: CONSTRAINED)
            }
            base
          }
        }
      }
    }
  `);


  const getImageByName = (name) => {
    const image = data.allFile.edges.find(edge => edge.node.base === name);
    return image ? getImage(image.node) : null;
  };


  const courses = [
    { name: '課程 1', platform: 'Udemy', icon: 'udemy-icon.png' },
    { name: '課程 2', platform: '知識衛星', icon: 'sat_knowledge_logo.jpeg' },
    { name: '課程 3', platform: 'Hahow', icon: 'hahow-icon.png' }
    // 更多課程...
  ];

  return (
    <div>
      <h1>我的線上課程集錦</h1>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>#</th>
            <th>課程名稱</th>
            <th>平台</th>
          </tr>
        </thead>
       <tbody>
          {courses.map((course, index) => (
            <tr key={index}>
              <td>
                <GatsbyImage image={getImageByName(course.icon)} alt={course.platform} />
              </td>
              <td>{course.name}</td>
              <td>{course.platform}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default CourseList;
