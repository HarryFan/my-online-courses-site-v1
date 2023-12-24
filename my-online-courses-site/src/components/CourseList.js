import React from 'react';
import { Table } from 'react-bootstrap';

const CourseList = () => {
  const courses = [
    { name: '課程 1', platform: 'Udemy', icon: 'udemy-icon.png' },
    { name: '課程 2', platform: '知識衛星', icon: 'xuewei-icon.png' },
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
              <td><img src={course.icon} alt={course.platform} style={{width: '30px'}}/></td>
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
