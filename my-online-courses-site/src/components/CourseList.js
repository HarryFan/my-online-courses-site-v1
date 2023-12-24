import React from 'react';
import { graphql, useStaticQuery } from 'gatsby';
import { GatsbyImage, getImage } from 'gatsby-plugin-image';
import { Table, Tooltip, OverlayTrigger } from 'react-bootstrap'; // 導入所需組件

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
    { name: 'Udemy課程', platform: 'Udemy', href:"https://www.udemy.com/", icon: 'udemy-icon.png', tooltip:"用我的google mail 備用帳號登入"},
    { name: '60天商管學院：教你如何賺錢、省錢、做出好決策', platform: '知識衛星', href:"https://sat.cool/classroom/60", icon: 'sat_knowledge_logo.jpeg',tooltip:"用我的google mail 主帳號登入" },
    { name: '動畫互動網頁特效入門（JS/CANVAS）', platform: 'Hahow', href:"https://hahow.in/courses/586fae97a8aae907000ce721", icon: 'hahow-icon.jpeg',tooltip:"用我的臉書主帳號登入" },    
    { name: '跟著版塊做網站：用動態特效點滿視覺創意', platform: 'Hahow', href:"https://hahow.in/courses/60939aa60390311a3a030a1e/discussions",icon: 'hahow-icon.jpeg',tooltip:"用我的臉書主帳號登入" },
    { name: 'Node.js、MongoDB 網站後端工程入門', platform: 'Hahow', href:"https://hahow.in/courses/60aeac37bca91777bf5bb114/discussions?item=60d37e4291602a62f8bfc224",icon: 'hahow-icon.jpeg' ,tooltip:"用我的臉書主帳號登入"}
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
            <td>
              <OverlayTrigger
                placement="right"
                overlay={<Tooltip id={`tooltip-${index}`}>{course.tooltip}</Tooltip>}
              >
                <a href={course.href} target="_blank" rel="noopener noreferrer">{course.name}</a>
              </OverlayTrigger>
            </td>
            <td>{course.platform}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  </div>
  );
};

export default CourseList;
