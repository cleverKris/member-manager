const path = require('path');
const express = require('express');
const multer = require('multer');
const db = require('./db');
const fs = require('fs');


const app = express();


// 设置静态资源
app.use(express.static(path.join(__dirname, 'public')));


// 文件上传处理
const uploader = multer({
    storage: multer.diskStorage({
        // 上传文件存放目录
        destination: (req, file, cb) => cb(null, __dirname + '/public/upload'),
        // 上传文件的文件名
        filename: (req, file, cb) => cb(null, file.originalname)
    })
});

/**
 * 获取全部会员列表
 */
app.get('/api/member-list', (req, res) => {
    const data = db.get();
    res.send(data);
});

/**
 * 分页获取
 */
app.get('/api/member-list-page', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const data = db.getByPage(page, 6);
    res.send(data);
});

/**
 * 最后一条获取
 */
app.get('/api/member-list-last', (req, res) => {
    const last = parseInt(req.query.last) || null;
    const data = db.getByLast(last, 6);
    res.send(data);
});

/**
 * 获取指定会员信息
 */
app.get('/api/member-detail', (req, res) => {
    const id = parseInt(req.query.id);
    if (!id) {
        return res.status(400).send({message: '请求参数异常'});
    }

    // 获取指定 ID 的数据
    const data = db.getById(id);

    data ? res.send(data) : res.status(404).send({message: '未找到对应数据'});
})

/**
 * 添加一个新会员
 */
app.post('/api/member-add', uploader.single('avatar'), (req, res) => {
    if (!(req.body.name && req.body.bio && req.file)) {
        return res.status(400).send({message: '请求参数异常'});
    }

    const member = {
        name: req.body.name,
        avatar: `/upload/${req.file.filename}`,
        bio: req.body.bio,
        created: new Date()
    };

    // 保存数据
    db.add(member);

    res.send({message: '数据保存成功'});
});

/**
 * 删除一个会员
 */
app.get('/api/member-delete', (req, res) => {
    const id = parseInt(req.query.id);
    if (!id) {
        return res.status(400).send({message: '请求参数异常'});
    }

    db.delete(id);
    res.send({message: '数据删除成功'});
});

app.listen(4000, (req, res) => {
    console.log('开始监听：4000');
});


/**
 * 修改一个会员
 * uploader.single('avatar') 文件上传处理
 * request.file.filename     icon-47.png
 */
app.post('/api/member-edit', uploader.single('avatar'), (request, response) => {
    //自己重新获取members.json的数据
    let jsonData = require('./members');

    //这个对象存储的是 需要修改之后的信息
    let obj = {
        id: parseInt(request.body.id),
        name: request.body.name,
        avatar: `/upload/${request.file.filename}`,
        bio: request.body.bio,
        created: new Date()
    };
    // 此时id为string字符串类型 所以才会出现一个bug
    // 跳转到首页之后 再次渲染view页面时会出错 因为路径中传的是string
    //response.send(typeof obj.id);

    //根据当前传入的参数 id 去数据源中匹配 id 的数据
    jsonData.forEach(value => {
        if (request.body.id == value.id) {
            //说明要修改的就是这个对象
            for (var key in obj) { //将对象中的所有属性替换
                value[key] = obj[key];
            }
        }
    });

    //将数据重新写入
    fs.writeFile('members.json', JSON.stringify(jsonData, null, 4), err => {
        if (err) {
            response.send({
                message: '出错啦'
            })
        } else {
            response.send({
                message: '更改会员信息成功'
            })
        }
    })
});
