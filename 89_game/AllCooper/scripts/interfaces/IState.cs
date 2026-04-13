/// <summary>
/// 状态接口
/// 定义状态机中单个状态的通用行为
/// </summary>
public interface IState
{
    /// <summary>进入状态时调用</summary>
    void Enter();

    /// <summary>退出状态时调用</summary>
    void Exit();

    /// <summary>每帧更新</summary>
    void Update(double delta);
}
